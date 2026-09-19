export interface Product{
    id:number;

    title:string;
    author:string;

    price:number;
    mrp:number;
    discountPercent?:number;

    image:string[];

    category:string;
    genre:string[];

    rating:number;
    reviewCount:number

    publisher:string;
    language:string;
    pages:number;

    createdAt:string
    description:string;

    stock:number
}