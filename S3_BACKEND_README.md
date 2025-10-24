# S3 Management Backend API

Complete backend API for managing AWS S3 bucket `100acress-media-bucket` with full CRUD operations and secure access control.

## 🚀 Features

- **Folder Management**: List, create, and organize S3 folders
- **Image Upload**: Multi-file upload with validation
- **File Management**: View, delete, and batch operations
- **Security**: JWT authentication and admin role verification
- **File Validation**: Size limits, type restrictions, and error handling
- **Bucket Policy Management**: Secure public access configuration

## 🔐 Security Configuration

### Bucket Policy

The S3 bucket `100acress-media-bucket` is configured with ACLs disabled for better security. Public access is managed through bucket policies:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::100acress-media-bucket/*"
        }
    ]
}
```

### Recommended Public Access Settings

1. **Block public access to buckets and objects granted through new access control lists (ACLs)**: ON
2. **Block public access to buckets and objects granted through any access control lists (ACLs)**: ON
3. **Block public access to buckets and objects granted through new public bucket or access point policies**: OFF
4. **Block all public access**: OFF

## 📁 S3 Bucket Structure

```
100acress-media-bucket/
├── 100acre/
├── festival-images/
├── insight-banners/
├── insights/
├── placeholder/
├── projectdata/
├── small-banners/
├── spaces/
├── test-uploads/
├── thumbnails/
└── uploads/
```

## 🛠 API Endpoints

### Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Folders

#### Get All Folders
```http
GET /api/s3/folders
```

#### Create New Folder
```http
POST /api/s3/folders
Content-Type: application/json

{
  "name": "new-folder-name"
}
```

### Images

#### Get Images from Folder
```http
GET /api/s3/images/{folderName}?page=1&limit=20
```

#### Upload Images
```http
POST /api/s3/upload
Content-Type: multipart/form-data

files: [File, File, ...] (max 20 files)
folder: "target-folder-name"
```

#### Delete Single Image
```http
DELETE /api/s3/images/{imageKey}
```

#### Batch Delete Images
```http
DELETE /api/s3/images/batch
Content-Type: application/json

{
  "keys": [
    "folder/image1.jpg",
    "folder/image2.jpg"
  ]
}
```

## 🔧 Configuration

### Environment Variables
Create `.env` file with:
```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=100acress-media-bucket

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3500
NODE_ENV=development
```

### File Validation Rules
- **Max File Size**: 10MB per file
- **Max Files**: 20 files per upload
- **Allowed Types**: JPEG, JPG, PNG, WebP, GIF
- **Naming**: Auto-generated UUID filenames

## 🚀 Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   - Copy `.env.example` to `.env`
   - Update with your AWS credentials
   - Set JWT secret

3. **AWS S3 Setup**:
   - Ensure bucket `100acress-media-bucket` exists
   - Apply the bucket policy shown above
   - Configure CORS if needed

4. **Start Server**:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🧪 Testing

Test API connectivity:
```bash
# List folders
curl -X GET http://localhost:3500/api/s3/folders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Upload test file
curl -X POST http://localhost:3500/api/s3/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@test.jpg" \
  -F "folder=test-uploads"
```

## 🔒 Security Best Practices

1. **Never commit AWS credentials** to version control
2. Use IAM roles with least privilege principle
3. Enable S3 server access logging
4. Set up CloudTrail for API activity monitoring
5. Implement rate limiting on API endpoints
6. Regularly rotate access keys

## 📊 Monitoring

Monitor your S3 usage through:
- AWS CloudWatch metrics
- S3 Server Access Logs
- API request logging
- Error tracking

## 🔄 API Versioning

Current API version: `v1`
Base URL: `/api/s3`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
