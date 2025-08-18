import { ProductType } from './ProductType';

export interface WishlistContextType {
    addToWishlist: (product: ProductType) => void;
    removeFromWishlist: (productId: string) => void;
    wishlistState: {
        wishlistArray: ProductType[];
    };
}
