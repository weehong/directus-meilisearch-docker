import { defineHook } from "@directus/extensions-sdk";
import axios from "axios";
import moment from "moment";
import dotenv from "dotenv";
import algoliasearch from "algoliasearch";

dotenv.config();

const algoliaClient = algoliasearch(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_KEY!
);
const algoliaIndex = algoliaClient.initIndex(process.env.INSTANT_SEARCH_INDEX!);

export default defineHook(({ action }) => {
  action("posts.items.create", async ({ key, payload }: any) => {
    const dateTime = moment().toISOString();

    if (payload.status === "published") {
      const algoliaRes = await algoliaIndex.saveObject({
        ...payload,
        objectID: key,
        id: key,
        date_created: dateTime,
        date_updated: dateTime,
      });

      const meiliRes = await axios.post(
        `${process.env.MEILI_HOST}/indexes/${process.env.INSTANT_SEARCH_INDEX}/documents`,
        {
          ...payload,
          id: key,
          date_created: dateTime,
          date_updated: dateTime,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.MEILI_MASTER_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (meiliRes.status !== 202 && algoliaRes.objectID !== key) {
        throw new Error("Failed to add post item in MeiliSearch");
      }

      console.log("Post Item created and added to MeiliSearch!");
    }
  });

  action("posts.items.update", async ({ keys, payload }: any) => {
    const algoliaRes = await Promise.all(
      keys.map(
        async (key: string) =>
          await algoliaIndex.partialUpdateObjects([
            { objectID: `${key}`, id: key, ...payload },
          ])
      )
    );

    const directusRes = await axios.get(
      `${process.env.DIRECTUS_HOST}/items/posts/${keys[0]}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.DIRECTUS_KEY}`,
        },
      }
    );

    if (directusRes.status !== 200 && algoliaRes[0].objectID !== keys[0]) {
      throw new Error("Failed to get post item from Directus");
    }

    const directusData = directusRes.data.data;

    if (directusData.status === "published") {
      const dateTime = moment().toISOString();

      const meiliRes = await axios.post(
        `${process.env.MEILI_HOST}/indexes/${process.env.INSTANT_SEARCH_INDEX}/documents`,
        {
          ...directusData,
          ...payload,
          date_updated: dateTime,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.MEILI_MASTER_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (meiliRes.status !== 202) {
        throw new Error("Failed to update post item in MeiliSearch");
      }

      console.log("Post Item updated and updated to MeiliSearch!");
    } else if (directusData.status === "draft") {
      const algoliaRes = await algoliaIndex.deleteObject(keys[0]);

      const meiliRes = await axios.delete(
        `${process.env.MEILI_HOST}/indexes/${process.env.INSTANT_SEARCH_INDEX}/documents/${keys[0]}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MEILI_MASTER_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (
        meiliRes.status !== 202 &&
        meiliRes.status !== 204 &&
        algoliaRes.taskID
      ) {
        throw new Error("Failed to delete post item in MeiliSearch or Algolia");
      }

      console.log(
        "Post Item deleted after status founded is a draft and deleted from MeiliSearch and Algolia!"
      );
    }
  });

  action("posts.items.delete", async ({ keys }: any) => {
    const algoliaRes = await algoliaIndex.deleteObject(keys[0]);

    const res = await axios.delete(
      `${process.env.MEILI_HOST}/indexes/${process.env.INSTANT_SEARCH_INDEX}/documents/${keys[0]}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MEILI_MASTER_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.status !== 204 && algoliaRes.taskID) {
      throw new Error("Failed to deleted post item in MeiliSearch or Algolia");
    }

    console.log("Post Item deleted and deleted from MeiliSearch and Algolia!");
  });
});
