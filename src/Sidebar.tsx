
// import entries from './entriesData.ts';
import './Sidebar.css'
import { useNavigate } from 'react-router-dom';
import plusButton from "./images/plusbutton.jpg"
import entries from "../backend/entriesData.json";
import { Link } from 'react-router-dom'

// type SidebarProps = {
//   onSelect: (index: number) => void; //onSelect is a function that takes a number and returns nothing
// };

export default function Sidebar() {
  const navigate = useNavigate();
  
  const handleNewEntry = async (e: React.FormEvent) => {
    // Filter only titles that match the pattern "Entry X"
    const entryNumbers = entries
      .map(entry => entry.title)
      // .map(entry => entry.id)
      .filter(title => /^Entry \d+$/.test(title)) // Matches "Entry 1", "Entry 2", etc.
      .map(title => parseInt(title.split(' ')[1])) // Extract number from "Entry X"
    const entryId  = entries.map(entry => entry.id);
    const nextId = entryId.length > 0 ? Math.max(...entryId) + 1 : 1;
    const newTitle = `Entry ${nextId}`;

    navigate('/entry', {
      state: {
        entry: { title: newTitle, content: '' },
        isNewEntry: true
      }
    });
    try {
      const response = await fetch('http://localhost:3001/save-entry', { //Sends the form data to your backend at localhost:3001
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle,
          
        }),
      });

      if (response.ok) {
        console.log('Title saved successfully');
      } else {
        console.error('Failed to save title');
      }
    } catch (err) {
      console.error('Error saving title:', err);
    }
  };
  return (
    <aside className="sidebar">
      <div className="sidebar-title-container">
        <p className="sidebar-title">Entries</p>
        <Link to="/entry" state={{ newEntry: true }}>
          <img 
          src={plusButton} 
          alt="Plus Button" 
          className="plus-button" 
          onClick={handleNewEntry}
        />
        </Link>
        
        {/* When you click on the plus button, it navigates to the /entry route and passes a new entry object as state */}
      </div>
      {entries.map((entry, index) => (
        <a className="list-item"
          key={index}
          onClick={() => navigate('/entry', { state: { entry } })} 
          //when you click on an entry, it navigates to the /entry route and passes the entry as state
          //passes an object that goes into something called location.state
          // state is something like this:
          // state: { entry: { title: 'Entry 1', content: 'Hola, como estas' } }
          style={{ cursor: 'pointer', display: 'block' }}
        >
          {entry.title}
        </a>
      ))}
    </aside>
  );
}
