import Header from '../components/Header';
import UserSearch from '../components/UserSearch';

const FriendsPage = () => {
  return (
    <div className="start-page">
      <Header />
      <main className="main-content">
        <h2>Search for friends</h2>
        <UserSearch />
      </main>
    </div>
  );
};

export default FriendsPage;