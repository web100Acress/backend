# S3 Manager Backend API

Complete backend API for managing AWS S3 bucket `100acress-media-bucket` with full CRUD operations.

## 🚀 Features

- **Folder Management**: List, create, and organize S3 folders
- **Image Upload**: Multi-file upload with validation
- **Image Management**: View, delete, and batch operations
- **Security**: JWT authentication and admin role verification
- **File Validation**: Size limits, type restrictions, and error handling
- **Batch Operations**: Multi-select delete and download

## 📁 S3 Bucket Structure

Your `100acress-media-bucket` contains these folders:,
```
100acress-media-bucket/
├── 100acre/
├── festival-images/
├── insight-banners/
├── insights
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

**Response:**
```json
{
  "success": true,
  "folders": [
    "100acre",
    "festival-images",
    "insight-banners",
    "insights",
    "placeholder",
    "projectdata",
    "small-banners",
    "spaces",
    "test-uploads",
    "thumbnails",
    "uploads"
  ]
}
```

#### Create New Folder
```http
POST /api/s3/folders
Content-Type: application/json

{
  "name": "new-folder-name"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Folder created successfully",
  "folder": "new-folder-name"
}
```

### Images

#### Get Images from Folder
```http
GET /api/s3/images/{folderName}?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "id": "unique-etag-id",
      "name": "image.jpg",
      "key": "folder/image.jpg",
      "url": "https://100acress-media-bucket.s3.ap-south-1.amazonaws.com/folder/image.jpg",
      "size": "245 KB",
      "lastModified": "2024-01-15",
      "type": "image/jpeg",
      "folder": "folder"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### Upload Images
```http
POST /api/s3/upload
Content-Type: multipart/form-data

files: [File, File, ...] (max 20 files)
folder: "target-folder-name"
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully uploaded 2 files",
  "files": [
    {
      "id": "unique-etag-id",
      "name": "uuid-filename.jpg",
      "originalName": "original-name.jpg",
      "key": "folder/uuid-filename.jpg",
      "url": "https://100acress-media-bucket.s3.ap-south-1.amazonaws.com/folder/uuid-filename.jpg",
      "size": "245 KB",
      "type": "image/jpeg",
      "folder": "folder"
    }
  ]
}
```

#### Delete Single Image
```http
DELETE /api/s3/images/{imageKey}
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
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

**Response:**
```json
{
  "success": true,
  "message": "Successfully deleted 2 images",
  "deleted": [
    {"Key": "folder/image1.jpg"},
    {"Key": "folder/image2.jpg"}
  ],
  "errors": []
}
```

#### Generate Presigned URL (Optional)
```http
POST /api/s3/presigned-url
Content-Type: application/json

{
  "fileName": "image.jpg",
  "fileType": "image/jpeg",
  "folder": "uploads"
}
```

## 🔧 Configuration

### Environment Variables
Create `.env` file with:
```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=ap-south-1

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
```

### File Validation Rules
- **Max File Size**: 10MB per file
- **Max Files**: 20 files per upload
- **Allowed Types**: JPEG, JPG, PNG, WebP, GIF
- **Naming**: Auto-generated UUID filenames

## 🛡 Security Features

1. **JWT Authentication**: All endpoints require valid JWT token
2. **Admin Role Check**: Verifies user has admin/superadmin role
3. **File Validation**: Strict file type and size validation
4. **Error Handling**: Comprehensive error responses
5. **Rate Limiting**: Built-in rate limiting (if configured)

## 📦 Dependencies

Required npm packages:
```json
{
  "aws-sdk": "^2.1692.0",
  "multer": "^1.4.5-lts.1",
  "uuid": "^9.0.0",
  "express": "^4.18.2"
}
```

## 🚀 Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install uuid
   ```

2. **Configure Environment**:
   - Copy `.env.example` to `.env`
   - Add your AWS credentials
   - Set JWT secret

3. **AWS S3 Setup**:
   - Ensure bucket `100acress-media-bucket` exists
   - Configure proper IAM permissions
   - Set CORS policy if needed

4. **Start Server**:
   ```bash
   npm run dev
   ```

## 🔍 Testing

Test API connectivity:
```bash
curl -X GET http://localhost:3500/api/s3/folders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📝 Frontend Integration

The S3Manager React component automatically uses these APIs:
- Fetches folders on component mount
- Displays images with pagination
- Handles file uploads with progress
- Supports batch operations
- Real-time error handling

## 🐛 Troubleshooting

### Common Issues:

1. **403 Forbidden**: Check AWS credentials and bucket permissions
2. **CORS Errors**: Configure S3 bucket CORS policy
3. **File Upload Fails**: Verify file size and type restrictions
4. **Authentication Errors**: Ensure JWT token is valid and user has admin role

### Debug Mode:
Enable detailed logging by setting:
```env
NODE_ENV=development
```

## 📊 Monitoring

Monitor S3 operations through:
- AWS CloudWatch metrics
- Application logs
- Error tracking
- Upload/download statistics

## 🔄 API Versioning

Current API version: `v1`
Base URL: `/api/s3`

Future versions will maintain backward compatibility.

---

**Note**: This API is designed specifically for the `100acress-media-bucket` and integrates seamlessly with the frontend S3Manager component.
