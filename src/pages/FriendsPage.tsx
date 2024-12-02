import Header from '../components/Header';
import UserSearch from '../components/UserSearch';
import FriendRequests from '../components/FriendRequests';

const FriendsPage = () => {
  return (
    <div className="start-page">
      <Header />
      <main className="main-content">
        <h2>Search for friends</h2>
        <UserSearch />
        <h2>Incoming Friend Requests</h2>
        <FriendRequests />
      </main>
    </div>
  );
};

export default FriendsPage;