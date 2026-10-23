import { Redirect } from 'expo-router';

/** A link the app has no screen for lands on the home screen, not on a list of every route. */
export default function NotFound() {
  return <Redirect href="/" />;
}
