import { CollectionView } from '@/components/Collection';
import { AuthedPage } from '@/components/Page';

export default async function Page() {
  return <AuthedPage>{() => <CollectionView />}</AuthedPage>;
}
