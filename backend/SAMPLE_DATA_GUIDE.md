# Sample Data Setup

This backend includes reusable demo records for presenting and testing the project.

## First-Time Setup

1. Install MongoDB and start the MongoDB service.
2. Open a terminal inside the `backend` folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env` and add your own API keys.
5. Run `npm run seed:sample`.
6. Start the backend with `npm start`.
7. Open another terminal inside `frontend`, run `npm install`, then `npm start`.

The sample-data command is safe to run repeatedly. It updates named sample records instead of creating duplicates.

## Required Existing Users

This seed does not create or modify any user documents. Before running it, the database must already contain:

- One NGO
- One approved Volunteer
- One User/Victim

The script automatically uses the first matching record for each role to link resources, incidents, requests, and tasks.

## Included Sample Records

- Food supplies with future expiry dates
- One expired food record to demonstrate expiry warnings
- Water, medicine, and tent resources
- Shelters and hospitals
- Flood incident, help request, and assigned volunteer task

Food with an expired date is marked `Expired`, excluded from usable-resource analytics, and blocked from allocation.
