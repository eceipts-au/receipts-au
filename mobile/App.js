import "expo-router/entry";
// mobile/App.js
import "expo-router/entry";
import { migrate } from "./src/db";

migrate(); // run DB migrations once at startup
