// server.js
import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
const GEMINI_API_URL = "https://gemini.googleapis.com/v1alpha2/models/text-bison-001:generateText";

app.post("/generate-text", async (req, res) => {
  try {
    const response = await axios.post(
      GEMINI_API_URL,
      {
        prompt: "Generate a ~50 word typing paragraph for a typing test",
        max_output_tokens: 200
      },
      {
        headers: {
          "Authorization": `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate text" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
