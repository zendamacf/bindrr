import { AuthedPage } from '@/components/Page';
import { WishlistView } from '@/components/Wishlist';

export default async function Page() {
  return <AuthedPage>{() => <WishlistView />}</AuthedPage>;
}
