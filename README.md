# Directus CMS and MeiliSearch with Docker
This README provides instructions on setting up a Directus CMS and MeiliSearch environment using Docker. The setup will allow you to manage your content with Directus and enable powerful search capabilities using MeiliSearch.

## Prerequisites
Before you begin, ensure you have the following installed:
- Docker
- Docker Compose

## Getting Started
Step 1: Clone the Repository
Clone this repository to your local machine:
```bash
git clone git@github.com:weehongkoh/directus-meilisearch-docker.git
cd directus-meilisearch-docker
```

Step 2: Generate the key and place on the necessary properties on `.env`

Step 3: Build the extension:
```bash
cd extension/instant-search-extension
npm run build
```

Step 4: Start the service:
```bash
docker compose up -d
```

## Read More
You can read more how to setup the service by reading this article.
https://vernonweehong.com/blog/6c31df81-bc56-4bd0-af8f-7436c1ec9b15