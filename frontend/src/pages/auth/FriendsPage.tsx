import Header from '../../components/Header.tsx';
import UserSearch from '../../components/UserSearch.tsx';
import FriendRequests from '../../components/FriendRequests.tsx';
import MyFriends from '../../components/MyFriends.tsx';

const FriendsPage = () => {
  return (
    <div className="start-page">
      <Header />
      <main className="main-content-friends">
        <h2 className='friends-h2'>My friends</h2>
        <MyFriends />
        <h2 className='friends-h2'>Search for friends</h2>
        <UserSearch />
        <h2 className='friends-h2'>Incoming Friend Requests</h2>
        <FriendRequests />
      </main>
    </div>
  );
};

export default FriendsPage;