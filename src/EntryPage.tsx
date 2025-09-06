import React from 'react'
import { useState, useEffect } from 'react'
import SideBar from './Sidebar.tsx'
import './EntryPage.css'
import { useLocation } from 'react-router-dom';
import entries from '../backend/entriesData.json';
import * as Diff from 'diff';

type Entry = { id: number; 
                title: string; 
                content: string; 
                correctedContent?: string; 
                isCorrected?: boolean;
                overallFeedback?: string
              };

export default function EntryPage() {
  const [wordCount, setWordCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [correctedContent, setCorrectedContent] = useState("");
  const [streakCount, setStreakCount] = useState(0);
  const [entryContent, setEntryContent] = useState("");
  const [displayedEntry, setDisplayedEntry] = useState<Entry | null>(null);
  const location = useLocation();
  const entry = location.state?.entry as Entry | undefined;
  const isNewEntry = location.state?.newEntry;
  const [displayedTitle, setDisplayedTitle] = useState(entry?.title);

  const highlightDifferences = (original: string, corrected: string) => {
    const diff = Diff.diffWords(original, corrected);
    
    return diff.map(part => {
      if (part.added) {
        return `<b class="highlight">${part.value}</b>`;
      } else if (part.removed) {
        return ''; // Don't show removed parts
      } else {
        return part.value;
      }
    }).join('');
  };


  

  useEffect(() => {
  fetch("http://localhost:3001/streak-count")
    .then(res => res.json())
    .then(data => {
      setStreakCount(data.streakCount || 0);
    })
    .catch(err => console.error("Error fetching streak count:", err));
  }, []);

  useEffect(() => {
    const words = entryContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
}, [entryContent]);

  useEffect(() => {
    document.body.style.overflowY = canScroll ? "auto" : "hidden";
  }, [canScroll]);
  

  useEffect(() => {
    setCanScroll(false);

    if (displayedEntry && !displayedEntry.isCorrected) {
      setCorrectedContent(""); // only reset if it wasn’t corrected yet
    }
    // setCorrectedContent(entry?.correctedContent || "");
    setReadOnly(false);
    setIsDisabled(false);
    setDisplayedEntry(entry || entries[0] || null);
    setEntryContent(entry?.content || entries[0]?.content || "");
    setDisplayedTitle(entry?.title || entries[0].title ||"");
  }, [displayedEntry])


  // If entry is passed via location, use it immediately
  useEffect(() => {
    if (entry) {
      setDisplayedEntry(entry);
      //setEntryContent(entry.content || "Nothing 1");
      // setDisplayedTitle(entry.title || "");
      console.log("title (usEeffect):", entry.title);
    }
  }, [entry]);
  
  // If no entry passed, fetch latest from backend
  useEffect(() => {
    if (!entry) {
      fetch("http://localhost:3001/entries?limit=1&sort=desc") // adjust to match your API
      //limit=1&sort=desc to get the latest entry
      //limit=1 get only one entry
      //sort=desc gets by descending order
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setDisplayedEntry(data[0]);
            setDisplayedTitle(data[0].title || "");
            setEntryContent(data[0].content || "");
          }
        })
        .catch(err => console.error("Error fetching latest entry:", err));
    }
  }, [entry]);

  // If creating a new entry, clear textarea
  useEffect(() => {
    if (isNewEntry) {
      setEntryContent("");
      setDisplayedTitle(entry?.title || "");
    }
  }, [isNewEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const response = await fetch("http://localhost:3001/save-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: displayedEntry?.id,
        title: displayedTitle,
        content: entryContent,
      }),
    });

    if (!response.ok) throw new Error("Failed to save entry");

    console.log("Entry saved successfully");

    if (response.ok) {
      const data = await response.json();
      setDisplayedEntry(data.entry); // Update to match backend
      setEntryContent(data.entry.content);
      setDisplayedTitle(data.entry.title);
      console.log("title (handleSubmit):", data.entry.title);
      if (entry) {
        entry.title = data.entry.title || "Untitled";
      }
      // console.log("content (handleSubmit):", entry?.title);
      
    }

  } catch (err) {
    console.error("Error saving entry:", err);
  }
};


  useEffect(() => {
  if (displayedEntry && displayedEntry.isCorrected) {
    var highlightedContent = highlightDifferences(displayedEntry.content, displayedEntry.correctedContent || "");
    setCorrectedContent(highlightedContent);
    // setCorrectedContent(displayedEntry.correctedContent || "");
    setCanScroll(true);
    setReadOnly(true);
    setIsDisabled(true);
  }
}, [displayedEntry]);

  if (!displayedEntry) {
    return (
    <>
    <div className="streak-counter">🔥Streak count: {streakCount}</div>
    <div className="entry-page">

      <p>Please select an entry</p>
    </div>
    <SideBar />
    </>
  );
  }
    const handleEntryTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > 78) {
      return;
    }
    setDisplayedTitle(e.target.value);
  };

  
    const handleDone = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      
      if (wordCount < 50) {
        return alert("Please write at least 50 words before submitting.");
      }

      setReadOnly(true);
      setIsDisabled(true);

      try {
        const response = await fetch("http://localhost:3001/ai-correct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: entryContent
          }),
        });
      if (!response.ok) throw new Error("Failed to get AI correction");
      
      const data = await response.json();
      const correctedText = data.correctedText || "";
      const overallFeedback = data.overallFeedback || "";
      var highlightedContent = highlightDifferences(entryContent, correctedText);
      
      setIsLoading(false);
      setCorrectedContent(highlightedContent);
      setCanScroll(true);
      
      
      const saveResponse = await fetch("http://localhost:3001/save-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: displayedEntry?.id,
          title: displayedTitle || "Untitled",
          content: entryContent,
          correctedContent: correctedText,
          overallFeedback: overallFeedback || "",
      }),
    });
      if (!saveResponse.ok) throw new Error("Failed to save content");
    
    const saveData = await saveResponse.json();
    setDisplayedEntry(saveData.entry);

  } catch (err) {
    console.error("Error in handleDone:", err);
    setCorrectedContent("AI correction failed.");
  }
};


  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEntryContent(e.target.value);
  }
  

  
  return (
    <>
    <div className="entry-page-container" style={{ overflowY: 'auto' }}>
      <div className="streak-counter">🔥Streak count: {streakCount}</div>
      <button id="ai-insight">AI Insights</button>
      
      <SideBar />
      <div className="entry-page">
        <form className="entry-title" >
          <textarea
            id="entry-title-textarea" 
            value={displayedTitle}
            onChange={handleEntryTitleChange}
            readOnly={readOnly}
          />
        </form>
        {/* <h1>{displayedEntry.title}</h1> */}
        <form onSubmit={handleSubmit}>
          <textarea
            className="write-entry"
            readOnly={readOnly}
            rows={11}
            cols={120}
            value={entryContent}
            placeholder="Mi dia fue..."
            onChange={handleTextAreaChange}
          />
          
          <p className="word-count">Word Count: {wordCount}</p>
          <button className="save-button" type="submit" disabled={isDisabled}>
            SAVE
          </button>
          <button disabled={isDisabled} 
                  className="done-button" 
                  type="button" 
                  onClick={handleDone}
                  style={{ cursor: isLoading ? 'wait' : 'pointer' }}
                  >
            DONE
          </button>
          
          {correctedContent && (
        <div
          className="corrected-entry"
          dangerouslySetInnerHTML={{ __html: correctedContent }}
        />
        
      )} 
        </form>
      </div>
      </div>
    </>
  );
}
