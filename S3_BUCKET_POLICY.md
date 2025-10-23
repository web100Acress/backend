# S3 Bucket Configuration for 100acress-media-bucket

## Issue: AccessControlListNotSupported Error

Your S3 bucket `100acress-media-bucket` has ACLs (Access Control Lists) disabled, which is a security best practice. Instead of using ACLs, you need to configure bucket policies for public access.

## ✅ Solution: Configure Bucket Policy

### 1. Make Bucket Publicly Readable (Recommended)

Add this bucket policy to make uploaded images publicly accessible:

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

### 2. How to Apply Bucket Policy

1. **Go to AWS S3 Console**
2. **Select your bucket**: `100acress-media-bucket`
3. **Go to Permissions tab**
4. **Scroll to Bucket Policy section**
5. **Click Edit**
6. **Paste the above JSON policy**
7. **Save changes**

### 3. Block Public Access Settings

Ensure these settings allow the policy:
- ✅ **Block public access to buckets and objects granted through new access control lists (ACLs)**: ON
- ✅ **Block public access to buckets and objects granted through any access control lists (ACLs)**: ON  
- ❌ **Block public access to buckets and objects granted through new public bucket or access point policies**: OFF
- ❌ **Block all public access**: OFF

## 🔒 Security Considerations

### Current Setup (Secure):
- ACLs are disabled ✅
- Only specific objects are publicly readable ✅
- Bucket listing is not public ✅
- Upload/Delete requires authentication ✅

### What the Policy Does:
- Allows public read access to uploaded images
- Does NOT allow public listing of bucket contents
- Does NOT allow public upload or delete
- Maintains security while allowing image display

## 🌐 Alternative: CloudFront Distribution (Advanced)

For better performance and security, consider using CloudFront:

1. **Create CloudFront Distribution**
2. **Set Origin to your S3 bucket**
3. **Configure Origin Access Control (OAC)**
4. **Update bucket policy to only allow CloudFront**

### CloudFront Bucket Policy:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::100acress-media-bucket/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
                }
            }
        }
    ]
}
```

## 🔧 Code Changes Made

The backend code has been updated to remove ACL parameters:

```javascript
// Before (Caused Error):
const uploadParams = {
  Bucket: BUCKET_NAME,
  Key: key,
  Body: file.buffer,
  ContentType: file.mimetype,
  ACL: 'public-read', // ❌ This caused the error
  // ...
};

// After (Fixed):
const uploadParams = {
  Bucket: BUCKET_NAME,
  Key: key,
  Body: file.buffer,
  ContentType: file.mimetype,
  // ACL removed - using bucket policy instead ✅
  // ...
};
```

## 🧪 Testing

After applying the bucket policy, test image access:

```bash
# Upload an image through your API
curl -X POST http://localhost:3500/api/s3/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@test-image.jpg" \
  -F "folder=test-uploads"

# Test public access to uploaded image
curl -I https://100acress-media-bucket.s3.ap-south-1.amazonaws.com/test-uploads/your-image.jpg
```

Should return `200 OK` for public access.

## 📝 Summary

1. ✅ **ACL Error Fixed**: Removed ACL parameters from upload code
2. 🔧 **Bucket Policy Required**: Apply the provided bucket policy for public read access
3. 🔒 **Security Maintained**: Only read access is public, upload/delete still requires auth
4. 🚀 **Ready to Use**: After bucket policy is applied, image uploads will work perfectly

---

**Next Steps:**
1. Apply the bucket policy in AWS Console
2. Test image upload through S3 Manager
3. Verify public access to uploaded images
4. Consider CloudFront for production use
