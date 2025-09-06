require('dotenv').config();
console.log('=== STARTING SERVER ===');

const express = require('express');
const cors = require('cors');
const Diff = require('diff');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const Anthropic = require('@anthropic-ai/sdk');

let apiKey;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Set this in your environment variables
});

console.log('API Key loaded:', process.env.ANTHROPIC_API_KEY ? '✅' : '❌');
// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Create entries file if it doesn't exist
const filePath = './entriesData.json';
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, '[]');
  console.log('Created entriesData.json');
}

const userFilePath = './userData.json';
if (!fs.existsSync(userFilePath)) {
  fs.writeFileSync(userFilePath, '[]');
  console.log('Created userData.json');
}

// TEST ROUTE
app.get('/test', (req, res) => {
  console.log('✅ Test route accessed');
  res.json({ 
    status: 'success', 
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

// AI CORRECTION ROUTE - WITH REAL AI
app.post('/ai-correct', async (req, res) => {
  console.log('🤖 AI Correct route accessed');
  console.log('Request body:', req.body);
  
  const { text } = req.body;
  // const text = `Holaa, este es un texto de prueba para corregir.`;
  
  if (!text) {
    console.log('❌ No text provided');
    return res.status(400).json({ error: 'No text provided' });
  }

  try {
    console.log('🔄 Making request to Claude API...');
    
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Please analyze this Spanish text and provide corrections. Format your response as JSON:
          
Original text: "${text}"

Please respond with this exact JSON structure:
{
  "correctedText": "[corrected version of the text]"
}`
        }]
    });
    const responseText = message.content[0].text;
    console.log('📥 Claude API Response:', responseText);
    // Parse the JSON response
    let analysisResult;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.log('⚠️ Could not parse JSON response, using fallback');
      analysisResult = {
        correctedText: "Could not parse JSON response", // Fallback to original
      };
    }

    console.log('✅ Sending Claude corrected text');
    res.json({ 
      correctedText: analysisResult.correctedText,
      success: true,
      message: 'Text analyzed by Claude AI'
    });

  } catch (error) {
    console.error('❌ AI Correction Error:', error.message);
    
    // Fallback response
    res.status(500).json({ 
      correctedText: text,
      success: false,
      message: 'AI unavailable',
      error: error.message
    });
  }
});


// NEW ROUTE: GET ERROR PATTERN ANALYSIS
app.get('/error-analysis', async (req, res) => {
  console.log('📊 Error analysis route accessed');
  
  try {
    // Read stored error patterns
    let errorPatterns = [];
    try {
      const fileContent = fs.readFileSync(errorPatternsFilePath, 'utf8');
      errorPatterns = JSON.parse(fileContent);
    } catch (err) {
      console.log('No error patterns found');
      return res.json({
        success: true,
        message: 'No error patterns to analyze yet',
        analysis: null
      });
    }

    if (errorPatterns.length < 5) {
      return res.json({
        success: true,
        message: 'Need more corrections to provide meaningful analysis',
        analysis: null
      });
    }

    // Get analysis from Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `Analyze these Spanish learning error patterns and provide personalized learning recommendations. Here are the recent errors:

${JSON.stringify(errorPatterns, null, 2)}

Please respond with this exact JSON structure:
{
  "topErrorTypes": [
    {
      "type": "[error type]",
      "frequency": [number],
      "percentage": [percentage as number]
    }
  ],
  "specificPatterns": [
    {
      "pattern": "[specific pattern like 'ser vs estar confusion']",
      "examples": ["[example 1]", "[example 2]"],
      "frequency": [number]
    }
  ],
  "recommendations": [
    {
      "area": "[grammar area to focus on]",
      "priority": "[high/medium/low]",
      "exercises": ["[exercise suggestion 1]", "[exercise suggestion 2]"],
      "resources": ["[learning resource suggestion]"]
    }
  ],
  "progressSummary": "[overall assessment of learning progress and main strengths/weaknesses]"
}`
      }]
    });

    const responseText = message.content[0].text;
    let analysisResult;
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.log('⚠️ Could not parse analysis JSON');
      analysisResult = {
        topErrorTypes: [],
        specificPatterns: [],
        recommendations: [],
        progressSummary: "Could not analyze error patterns"
      };
    }

    res.json({
      success: true,
      analysis: analysisResult,
      totalErrors: errorPatterns.length
    });

  } catch (error) {
    console.error('❌ Error Analysis Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not analyze error patterns',
      error: error.message
    });
  }
});
// STREAK COUNT ROUTE
app.get('/streak-count', (req, res) => {
  console.log('📅 Streak count route accessed');
  
  let existing = [];
  try {
    const fileContent = fs.readFileSync(userFilePath, 'utf8');
    existing = JSON.parse(fileContent);
  } catch (err) {
    console.log('Error reading entries file:', err);
  }

  const lengthUser = existing.length;
  const streakCount = lengthUser > 0 ? (existing[0].streakCount || 1) : 0;
  res.json({ streakCount });
});

// SAVE ENTRY ROUTE
app.post('/save-entry', (req, res) => {
  console.log('💾 Save entry route accessed');
  
  let existing = [];
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    existing = JSON.parse(fileContent);
  } catch (err) {
    console.log('Starting with empty entries array');
    existing = [];
  }
  const { id, title = 'Untitled', content = '' } = req.body;
  console.log('Saving:', { id, title, contentLength: content.length });

  let savedEntry;
  
  if (id && id !== 0) {
    // Update existing entry
    const index = existing.findIndex(entry => entry.id === id);
    if (index !== -1) {
      existing[index].content = content;
      existing[index].title = title;
      savedEntry = existing[index];
    }
  }
  
  if (!savedEntry) {
    // Create new entry
    const maxId = existing.length > 0 ? Math.max(...existing.map(e => e.id || 0)) : 0;
    savedEntry = { id: maxId + 1, title, content, 
      date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
    };
    existing.unshift(savedEntry);
  }
  
  // Save to file
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
  console.log('✅ Entry saved successfully');
  
  res.json({ success: true, entry: savedEntry });
});


// SAVE NEW CONTENT TO EXISTING ENTRY ROUTE
app.post('/save-content', (req, res) => {
  console.log('💾 Save content route accessed');
  
  let existing = [];
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    existing = JSON.parse(fileContent);
  } catch (err) {
    console.log('Starting with empty entries array');
    existing = [];
  }
  
  let userExisting = [];
  try {
    const userFileContent = fs.readFileSync(userFilePath, 'utf8');
    userExisting = JSON.parse(userFileContent);
  } catch (err) {
    userExisting = [];
  }
  let streakCount;
  const lastEntry = userExisting[0];
  const lastDate = lastEntry.lastEntryDate;
  const todayDate = new Date();
  todayDate.setMinutes(todayDate.getMinutes() - todayDate.getTimezoneOffset()); // UTC offset
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const todayStr = todayDate.toISOString().slice(0, 10);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10)

  if (yesterdayStr === lastDate) {
    console.log('Yesterday\'s entry found, incrementing streak count');
    streakCount = (lastEntry.streakCount || 0) + 1;
  } else if ((lastDate === todayStr)) {
    console.log('New day, resetting streak count');
    streakCount = lastEntry.streakCount;
  } else {
    console.log("New day, streak reset");
    streakCount = 1;
  }
  userExisting[0].streakCount = streakCount;
  userExisting[0].lastEntryDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const { id, title = 'Untitled', content, correctedContent = ''} = req.body;
  
  let savedEntry;

  if (id && id !== 0) {
    // Update existing entry
    const index = existing.findIndex(entry => entry.id === id);
    if (index !== -1) {
      existing[index].content = content;
      existing[index].correctedContent = correctedContent;
      existing[index].isCorrected = true;
      console.log('Updating existing entry:', existing[index]);
      savedEntry = existing[index];
      
    }
  }
  if (!savedEntry) {
    // Create new entry
    const maxId = existing.length > 0 ? Math.max(...existing.map(e => e.id || 0)) : 0;
    savedEntry = { 
      id: maxId + 1, 
      title, 
      content: content, 
      date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10), 
      correctedContent: correctedContent,
      isCorrected: true 
    };
    existing.unshift(savedEntry);
  }
  // Save to file
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
  console.log('✅ Entry saved successfully');

  fs.writeFileSync(userFilePath, JSON.stringify(userExisting, null, 2));
  console.log('✅ User data saved successfully');
  
  res.json({ success: true, entry: savedEntry });
})

// GET ENTRIES ROUTE
app.get('/entries', (req, res) => {
  console.log('📚 Get entries route accessed');
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let data = JSON.parse(fileContent);
    
    const { limit, sort } = req.query;
    console.log('Query params:', { limit, sort });
    
    if (sort === 'desc') {
      data.sort((a, b) => (b.id || 0) - (a.id || 0));
    }
    
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum)) {
        data = data.slice(0, limitNum);
      }
    }
    
    console.log(`✅ Returning ${data.length} entries`);
    res.json(data);
    
  } catch (err) {
    console.error('Error reading entries:', err);
    res.json([]);
  }
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log('');
  console.log('✅ Ready to handle requests!');
  console.log('💡 Press Ctrl+C to stop');
  console.log('='.repeat(50));
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});