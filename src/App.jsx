import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import OpenAI from 'openai';

function App() {
  const [url, setUrl] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const loadingMessages = [
    "Connecting to Twitter/X API...",
    "Extracting engagement metrics...",
    "Analyzing interaction patterns...",
    "Processing sentiment data...",
    "Calculating performance KPIs...",
    "Evaluating social media impact...",
    "Generating audience insights...",
    "Comparing with benchmarks...",
    "Preparing personalized recommendations...",
    "Finalizing detailed analysis..."
  ];

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
        setLoadingMessage(randomMessage);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  const transformUrl = (originalUrl) => {
    // Extraer el ID del reporte
    const id = originalUrl.split('/').pop();
    return `https://s3.eu-west-1.amazonaws.com/stats.tweetbinder.com/${id}/stats.json`;
  };

  // Función aproximada para contar tokens (4 caracteres ≈ 1 token)
  const estimateTokenCount = (text) => {
    return Math.ceil(text.length / 4);
  };

  const filterRelevantData = (jsonData) => {
    // Verificamos que existan las propiedades necesarias
    if (!jsonData?.stats?.general || !jsonData?.stats?.sentiment || !jsonData?.stats?.influences) {
      throw new Error('El formato del JSON no es válido');
    }

    const { stats } = jsonData;
    
    const filteredData = {
      stats: {
        general: stats.general,
        sentiment: stats.sentiment,
        influences: {
          sentimentInfluence: stats.influences.sentimentInfluence,
          contributorInfluence: stats.influences.contributorInfluence,
          tweetValueInfluence: stats.influences.tweetValueInfluence
        }
      }
    };

    // Verificamos el tamaño aproximado
    const jsonString = JSON.stringify(filteredData);
    const estimatedTokens = estimateTokenCount(jsonString);
    setTokenCount(estimatedTokens);

    if (estimatedTokens > 8000) {
      throw new Error('Los datos exceden el límite de tokens de OpenAI (8000)');
    }

    return filteredData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse('');
    setAnalysis(null);
    
    try {
      const transformedUrl = transformUrl(url);
      const jsonResponse = await axios.get(transformedUrl);
      
      const relevantData = filterRelevantData(jsonResponse.data);
      
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert analyst in Social Media Analytics and Data Analytics, specialized in Twitter / X metrics. We are going to analyze a report by Tweet Binder, the reports by Tweet Binder analyze a Twitter query, it can be a hashtag, a cashtag, a word etc. within a certain date range. These reports analyze the number of tweets, their typology, number of users, engagement, impact and much more. It is used by companies and agencies around the world to analyze campaigns and all kinds of events and events on Twitter / X. What matters most to us is seeing the impact of each report, for that we will look at the JSON "impressions" field especially. We will put it in relation to the "impact" field which are the potential impressions of the report. That is, the closer the "impressions" are to "general" in the JSON (real impressions) of the "impact" within "general" in the JSON (potential impressions) the better. Keep in mind that if the report has many replies (the "replies" field within "general" in the JSON) the impact will always be less because the replies on Twitter have much less visibility in people's timelines since only they are seen by common followers of the account that replies and the account that receives it. 

On the other hand, we will look at the engagement of the report that is determined by the following metrics within stats - general:

- receivedRetweets: these are the RTs received by the report tweets. They do not have to match the “retweets ” field because the “retweets ” field includes only the public retweets in the report, the rest of the retweets may be from private twitter accounts, or are outside the date range of the report or have even been deleted. The more receivedRetweets the better, that means engagement is high.
- Favorites: these are the likes received by the report tweets. The more likes the better.
- Quotes: these are the quotes received by the report tweets. The more quotes the better.
- Bookmarks: these are the Bookmarks received by the report tweets. The more Bookmarks the better. The number of bookmarks is usually very low compared to that of likes and RTs
- totalReplies: these are the replies received by the report's tweets. It is important not to confuse them with the field “replies ” which are the replies that are within the report. That is, “replies ” refers to the number of replies that contain the query analyzed in the report, a hashtag, a keyword, etc. The totalReplies field refers to the number of replies that the report tweets have received, the total Replies do not affect the impact of the report unless they contain the analyzed query.

Your experience includes:
- Advanced engagement analysis and interaction metrics
- Evaluation of the scope and impact of campaigns
- Interpretation of social media KPIs
- Performance benchmarking on social networks

Do not use markdown in the response, use plain text. if possible, use bullet points and html markup. like <ul> <li> <p> <h4> <h3> <h2> <h1>

`

          },
          {
            role: "user",
            content: `Analyze this Twitter/X data and provide a detailed engagement and exposure analysis & valoration:
            
            Report data: ${JSON.stringify(relevantData, null, 2)}
            
            Please include:
            - Engagement level rating (high/medium/low) with justification
            - Analysis of real vs potential impressions relationship
            - Sentiment evaluation and its correlation with engagement
            - Key conclusions and recommendations`
          }
        ],
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 1000
      });

      setAnalysis(completion.choices[0].message.content);
      setResponse('Tweet Binder AI has successfully analyzed the report');
    } catch (error) {
      setResponse('Error: ' + error.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Cerrar el menú cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(analysis);
      setShowMenu(false);
      // Opcional: Mostrar un toast o notificación de éxito
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Tweet Binder Analysis</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            h1 { color: #00A2F3; }
            .date { color: #666; font-size: 0.9em; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Engagement and Exposure Analysis</h1>
          ${analysis.split('\n').map(p => `<p>${p}</p>`).join('')}
          <div class="date">Generated on ${new Date().toLocaleDateString()}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    setShowMenu(false);
  };

  return (
    <div className="min-h-screen gradientbody flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <img 
            src="https://cdn.prod.website-files.com/663a49d30c0b5fdc230dc032/67642279b1f8d85c0c65a386_logo_tweet_binder.svg"
            alt="Tweet Binder Logo"
            className="h-12 mx-auto mb-4"
          />
          <h2 className="text-4xl font-extrabold text-[#3981f7] tracking-tight">
            Tweet Binder
            <span className="text-gray-900"> Analyzer</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Analyze your Twitter reports with AI
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-blue-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 flex items-center">
              <span class="material-icons">link</span>
                Report URL
              </label>
              <div className="relative">
                <input
                  id="url"
                  name="url"
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="block w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 
                    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3981f7] focus:border-transparent
                    transition-all duration-200 text-base"
                  placeholder="https://dash.tweetbinder.com/report/..."
                />
                <span className="material-icons absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  search
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !url}
              className={`w-full flex justify-center items-center py-3 px-4 rounded-xl text-base font-medium
                transition-all duration-200 shadow-md hover:shadow-lg
                ${isLoading || !url 
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-[#3981f7] hover:bg-[#2d6ad9] text-white hover:scale-[1.02]'
                }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  <span className="material-icons mr-2">auto_awesome</span>
                  Analyze URL
                </>
              )}
            </button>
          </form>

          {response && (
            <div className={`p-4 rounded-xl transition-all duration-300 ${
              response === 'Tweet Binder AI has successfully analyzed the report' 
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-base font-medium flex items-center justify-center ${
                response === 'Tweet Binder AI has successfully analyzed the report' 
                  ? 'text-green-800' 
                  : 'text-red-800'
              }`}>
                <span className="material-icons mr-2">
                  {response === 'Tweet Binder AI has successfully analyzed the report' 
                    ? 'check_circle' 
                    : 'error'}
                </span>
                {response}
              </p>
            </div>
          )}

          {isLoading && (
            <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#3981f7] animate-pulse rounded-full"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-600 font-medium">{loadingMessage}</span>
                </div>
              </div>
            </div>
          )}

          {analysis && (
            <div className="bg-white rounded-xl p-8 shadow-lg border border-blue-100 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  Engagement and Exposure Analysis
                </h3>
                
                {/* Actions menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-11 h-11 flex items-center justify-center rounded-full bg-[#e8f3fe] hover:bg-[#e8f3fe]/80 transition-colors duration-200"
                    aria-label="Actions menu"
                  >
                    <span className="material-icons text-[#3981f7]">more_vert</span>
                  </button>
                  
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10">
                      <ul className="py-1">
                        <li>
                          <button
                            onClick={handleCopyToClipboard}
                            className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:text-[#3981f7] bg-white hover:bg-[#e8f3fe] flex items-center group transition-colors duration-200"
                          >
                            <span className="material-icons text-gray-400 mr-2 text-base group-hover:text-[#3981f7]">
                              content_copy
                            </span>
                            Copy analysis
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={handlePrint}
                            className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:text-[#3981f7] bg-white hover:bg-[#e8f3fe] flex items-center group transition-colors duration-200"
                          >
                            <span className="material-icons text-gray-400 mr-2 text-base group-hover:text-[#3981f7]">
                              print
                            </span>
                            Print analysis
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="prose prose-blue max-w-none">
                {analysis.split('\n').map((paragraph, index) => {
                  if (paragraph.match(/^#|^\d+\./)) {
                    return <h4 key={index} className="text-xl font-semibold text-gray-800 mt-6">{paragraph.replace(/^#|\d+\.\s*/, '')}</h4>;
                  }
                  if (paragraph.startsWith('-')) {
                    return <li key={index} className="text-gray-600 ml-4">{paragraph.substring(1)}</li>;
                  }
                  if (paragraph.trim()) {
                    return <p key={index} className="text-gray-600">{paragraph}</p>;
                  }
                  return null;
                })}
              </div>

              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-gray-500 text-center">
                  Analysis generated by AI • {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;