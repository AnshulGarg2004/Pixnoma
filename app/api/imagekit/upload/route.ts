import { auth } from '@clerk/nextjs/server'
import ImageKit from 'imagekit'
import { NextResponse } from 'next/server';

const imagekit = new ImageKit({
    publicKey : process.env.IMAGEKIT_PUBLIC_KEY !,
    privateKey : process.env.IMAGEKIT_PRIVATE_KEY! ,
    urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT! 
})

export async function POST(request : Request) {
    const {userId} = await auth();
    if(!userId) {
        return NextResponse.json({success : false, message : "User not authenticated"}, {status : 500});
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const fileName = formData.get('fileName') as string;
    
        if(!file) {
            return NextResponse.json({success : false, message : "No File Provided"}, {status : 404});
        }
    
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const timestamps = Date.now();
    
        const sanitizedFileName = fileName?.replace(/[^a-zA-Z0-9.-]/g, "_") || "upload";
    
        const uniqueFileName = `${userId}/${timestamps}_${sanitizedFileName}`;

        const uploadResponse = await imagekit.upload({
            file : buffer,
            fileName : uniqueFileName,
            folder : '/projects'
        });

        // Generate a landscape-friendly thumbnail (keeps aspect ratio, max 800x450)
        const thumbnailUrl = imagekit.url({
            src: uploadResponse.url,
            transformation: [
                {
                    width: 800,
                    height: 450,
                    quality: 90,
                    crop: 'at_max'
                }
            ]
        });

        return NextResponse.json({success : true, message : "uploaded Successfully", url : uploadResponse.url, thumbnailUrl : thumbnailUrl, fileId : uploadResponse.fileId, 
            width : uploadResponse.width, height : uploadResponse.height, size : uploadResponse.size, name : uploadResponse.name
        }, {status : 200});
    } catch (error) {
        console.log("Image kit upload error: ", error);
        return NextResponse.json({success : false, message : "Error uploading to imagekit"}, {status : 500})
        
    }
}