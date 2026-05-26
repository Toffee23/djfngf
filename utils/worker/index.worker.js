import { config } from "dotenv";
config();

import "./mailWorker.js"; // so i can run the worker on separate processes if martins can opt to get another server for it
