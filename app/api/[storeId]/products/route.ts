import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      price,
      categoryId,
      colorId,
      sizeId,
      images,
      isFeatured,
      isArchived,
    } = body;

    if (!name) {
      return new NextResponse("Name is Required", { status: 400 });
    }
    if (!price) {
      return new NextResponse("Price is Required", { status: 400 });
    }
    if (!categoryId) {
      return new NextResponse("Category Id is Required", { status: 400 });
    }
    if (!colorId) {
      return new NextResponse("Color Id is Required", { status: 400 });
    }
    if (!sizeId) {
      return new NextResponse("Size Id is Required", { status: 400 });
    }
    if (!images) {
      return new NextResponse("Images is Required", { status: 400 });
    }
    if (!isFeatured) {
      return new NextResponse("Featured is Required", { status: 400 });
    }
    if (!params.storeId) {
      return new NextResponse("Store ID is Required", { status: 400 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const product = await prismadb.product.create({
      data: {
        name,
        price,
        categoryId,
        colorId,
        sizeId,
        images:{
            createMany:{
                data:[
                    ...images.map((image:{ url: string})=> image)
                ]
            }
        },
        isFeatured,
        isArchived,
        storeId: params.storeId,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.log("Product_POST ", error);
    return new NextResponse("Internal Error ", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { searchParams} = new URL(req.url);
    const categoryId =  searchParams.get("categoryId") || undefined;
    const colorId =  searchParams.get("colorId") || undefined;
    const sizeId =  searchParams.get("sizeId") || undefined;
    const isFeatured =  searchParams.get("isFeatured") || undefined;

    if (!params.storeId) {
      return new NextResponse("Store ID is Required", { status: 400 });
    }

    const product = await prismadb.product.findMany({
      where: {
        storeId: params.storeId,
        categoryId,
        sizeId,
        colorId,
        isFeatured: isFeatured? true: undefined,
        isArchived: false
      },
      include:{
        images:true,
        category:true,
        color:true,
        size:true
      },
      orderBy:{
        createdAt:"desc"
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.log("Product_GET ", error);
    return new NextResponse("Internal Error ", { status: 500 });
  }
}
