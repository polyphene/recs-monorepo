## Renewable Energy Certificates Monorepo

This repository contains the code for the RECs marketplace.

## Repository structure

The respository is composed of two main folders: 
- `server`: contains all the logic for the backend of our application. This codebase is in charge of listening to on-chain
events and facilitating on-chain data exploration. It is built with [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server) and [Prisma](https://www.prisma.io/)
- `web`: contains the application UI codebase. The UI is built with [ReactJS](https://react.dev/) and [NextJS](https://nextjs.org/), [Tailwind](https://tailwindcss.com/), and 
[Shadecn UI components](https://ui.shadcn.com/).