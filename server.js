import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { S3Client, PutObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3";

dotenv.config();
const app = express();
app.use(express.static("public"));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    }
});

const bucket = process.env.AWS_BUCKET;

// Upload file to S3
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

// List uploaded files
app.get("/files", async (req, res) => {
    try {
        const data = await s3.send(new ListObjectsCommand({ Bucket: bucket }));
        res.json(data.Contents || []);
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to get files");
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));
