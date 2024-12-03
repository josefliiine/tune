import Header from '../components/Header';
import UserSearch from '../components/UserSearch';
import FriendRequests from '../components/FriendRequests';
import MyFriends from '../components/MyFriends';

const FriendsPage = () => {
  return (
    <div className="start-page">
      <Header />
      <main className="main-content">
        <h2>Search for friends</h2>
        <UserSearch />
        <h2>Incoming Friend Requests</h2>
        <FriendRequests />
        <h2>My friends</h2>
        <MyFriends />
      </main>
    </div>
  );
};

export default FriendsPage;