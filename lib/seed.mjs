// The order of these fictional profiles is the fresh-install demo order.
const rows = [
  ['Anika Rao', 24, 'Bengaluru', 'Usually following the smell of good coffee or taking the scenic route home.', 'Coffee,Film photography,Books'],
  ['Rohan Mehta', 26, 'Pune', 'Here for Sunday drives, ambitious playlists, and finding the best vada pav in town.', 'Road trips,Music,Food'],
  ['Meera Nair', 25, 'Bengaluru', 'Always up for one more chapter, one more coffee, or a walk with no destination.', 'Books,Coffee,Long walks'],
  ['Kabir Shah', 27, 'Mumbai', 'I make excellent dosa and take terrible pictures of it.', 'Cooking,Cricket,Running'],
  ['Isha Menon', 23, 'Kochi', 'I keep a running list of places with good chai and better people-watching.', 'Chai,Sketching,Cinema'],
  ['Arjun Das', 26, 'Hyderabad', 'Big fan of street food, quiet bookstores, and getting cheerfully lost.', 'Books,Street food,Travel'],
  ['Naina Iyer', 24, 'Chennai', 'The friend who takes the group photo and then asks for one more for the film roll.', 'Photography,Beach walks,Music'],
  ['Dev Malhotra', 28, 'Delhi', 'Can talk about design for hours. Will make time for a good breakfast first.', 'Design,Breakfast,Cycling'],
  ['Riya Thomas', 24, 'Kochi', 'My ideal Saturday starts with the farmers market and ends with a movie.', 'Markets,Cinema,Plants'],
  ['Aditya Sen', 25, 'Kolkata', 'Between novels, badminton games, and an ongoing search for the perfect roll.', 'Badminton,Books,Food'],
  ['Tara Bhat', 27, 'Bengaluru', 'Soft spot for live gigs, tiny galleries, and badly behaved dogs.', 'Live music,Art,Dogs'],
  ['Vihaan Patel', 26, 'Ahmedabad', 'Looking for someone to join me for a sunrise ride and a very long brunch.', 'Cycling,Brunch,Travel'],
  ['Sana Khan', 25, 'Hyderabad', 'I collect postcards, cook for my friends, and never skip dessert.', 'Cooking,Travel,Dessert'],
  ['Neil D’Souza', 27, 'Goa', 'I know a quiet beach and a loud jazz bar. The order is up to you.', 'Jazz,Beaches,Reading'],
  ['Aditi Joshi', 24, 'Pune', 'Currently trying to make a decent pot and keep my basil alive.', 'Ceramics,Plants,Coffee'],
  ['Karan Gill', 29, 'Chandigarh', 'Good at making parathas. Even better at finding a good trail.', 'Hiking,Cooking,Travel'],
  ['Leela Roy', 23, 'Kolkata', 'Give me a rainy afternoon, a sketchbook, and somewhere to sit by the window.', 'Illustration,Tea,Music'],
  ['Siddharth Jain', 28, 'Jaipur', 'Museum person, early riser, and enthusiastic maker of picnic sandwiches.', 'Museums,Running,Cooking'],
  ['Divya Pillai', 25, 'Chennai', 'I’m building a bookshelf faster than I’m finishing the books on it.', 'Books,DIY,Cinema'],
  ['Rahul Bose', 27, 'Kolkata', 'My favourite plans usually involve a football, a train, or both.', 'Football,Train travel,History'],
  ['Maya Fernandes', 26, 'Goa', 'My camera roll is half sea, half food, with a few blurry dogs in between.', 'Photography,Dogs,Food'],
  ['Aman Verma', 24, 'Delhi', 'I like long metro rides and conversations that make me miss my stop.', 'Podcasts,Books,Street food'],
  ['Zoya Ali', 26, 'Mumbai', 'I have a weekend baking project and a strong opinion about cardamom.', 'Baking,Chai,Theatre'],
  ['Nikhil Reddy', 25, 'Hyderabad', 'Will happily trade a bad pun for your favourite soundtrack.', 'Music,Cinema,Board games'],
  ['Neha Kulkarni', 27, 'Pune', 'Free evenings are for bouldering, a good thali, or both if I time it right.', 'Climbing,Food,Travel'],
  ['Yash Kapoor', 28, 'Delhi', 'Making friends with the neighbourhood cats one cautious eyebrow raise at a time.', 'Cats,Photography,Chess'],
  ['Kavya Prasad', 24, 'Mysuru', 'Ask me for a walking route with good trees and a breakfast stop.', 'Long walks,Plants,Breakfast'],
  ['Samir Sheikh', 26, 'Mumbai', 'I can turn a quiet evening into a good dinner with whatever is in the fridge.', 'Cooking,Music,Cricket'],
  ['Avni Desai', 25, 'Ahmedabad', 'Never met a craft fair I could walk through quickly.', 'Crafts,Design,Coffee'],
  ['Rehan Mathew', 27, 'Kochi', 'Beginner surfer, competent reader, very committed ice cream fan.', 'Surfing,Books,Ice cream'],
];

export const profiles = rows.map(([name, age, city, bio, interests], index) => {
  const number = String(index + 1).padStart(2, '0');
  return {
    id: `profile-${number}`,
    name,
    age,
    city,
    bio,
    interests: interests.split(','),
    photo: `/portraits/${number}.webp`,
  };
});

export const incomingLikes = ['profile-03', 'profile-06', 'profile-11', 'profile-16', 'profile-23', 'profile-29'];
