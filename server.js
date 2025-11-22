import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { S3Client, PutObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3";

dotenv.config();
const app = express();

// Serve public folder
app.use(express.static("public"));

// Fix CORS / JSON
app.use(express.json());

// Multer in-memory upload
const upload = multer({ storage: multer.memoryStorage() });

// S3 connection
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    }
});

const bucket = process.env.AWS_BUCKET;

// Explicit route for "/"
app.get("/", (req, res) => {
    res.sendFile(process.cwd() + "/public/index.html");
});

// Upload file
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const params = {
            Bucket: bucket,
            Key: req.file.originalname,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        };

        await s3.send(new PutObjectCommand(params));
        res.send("File uploaded successfully!");
    } catch (err) {
        console.error(err);
        res.status(500).send("Upload failed");
    }
});

// List files
app.get("/files", async (req, res) => {
    try {
        const data = await s3.send(new ListObjectsCommand({ Bucket: bucket }));
        res.json(data.Contents || []);
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to get files");
    }
});

// Render requires this dynamic port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
