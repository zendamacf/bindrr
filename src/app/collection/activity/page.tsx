import { CollectionActivityView } from '@/components/Collection/CollectionActivityView';
import { AuthedPage } from '@/components/Page';

export default async function Page() {
  return <AuthedPage>{() => <CollectionActivityView />}</AuthedPage>;
}
