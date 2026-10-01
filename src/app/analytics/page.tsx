import { CollectionAnalyticsView } from '@/components/Collection/CollectionAnalyticsView';
import { AuthedPage } from '@/components/Page';

export default async function Page() {
  return <AuthedPage>{() => <CollectionAnalyticsView />}</AuthedPage>;
}
