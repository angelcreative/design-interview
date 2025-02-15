import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import OpenAI from 'openai';
import { marked } from 'marked';

function App() {
  const [url, setUrl] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatRef = useRef(null);

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
            content: `He is an expert analyst in Social Media Analytics and Data Analytics, specializing in Twitter/X metrics. To analyze the information from the Tweet Binder, the information from the Tweet Binder will be analyzed by a query from Twitter, using a hashtag, a cash tag, a palabra, etc. This will determine the ranking of the fechas. It informs analysis of the number of tweets, the tipology, the number of users, engagement, impact and much more. Lo usan empresas y agencias de todo el mundo for analizar campañas y all type of acts and events on Twitter/X. The most important thing is that it has an impact on the information, for we have images in the field of "impressions" of JSON specifically. The pondremos en relación with the campo "impact" que son las impressiones potentiales del informe. This means that the "impressions" in the "general" in the JSON (real impressions) of the "impact" in the "general" in the JSON (in the potential impressions) are more important. There are many replies in the information field (the field "replies" dentro de "general" in JSON) the impact is very small, so the replies on Twitter are very visible in the timelines of the gente and they are only spoken by the seguidores in the community que hace la reply y la cuenta que la recibe.

For other purposes, we have information about the involvement of the information that determines the metrics of the stats - general:

- receivedRetweets: estos son los RTs recibidos por los tweets del informe. No tienen por qué coincidir con el campo "retweets" porque el campo "retweets" incluye sólo los retweets públicos que hay en el informe, puede que el resto de retweets sean de cuentas de twitter privadas, o estén fuera del rango de fecha del informe or se hayan incluso eliminated. Cuantos more receivedRetweets more, it is significant that the engagement is high.
- Favorites: these are the likes received by the tweets from the information. Cuantos more likes more.
- Quotes: these are the quotes recibidos por los tweets del informe. Cuantos more quotes are better.
- Bookmarks: these are the Bookmarks recibidos por los tweets del informe. Cuantos more Bookmarks more. The number of bookmarks is very important in comparison with the likes and RTs
- totalReplies: these are the replies received from the tweets of the informe. It is important not to confuse with the field "replies" that the replies have to be informed. It decides, "replies" has referencia al número de replies que los tweets del informe han recibido, los totalReplies no afectan al impacto del informe a no ser que contengan la query analizada.

Your experience includes:
- Análisis advanced engagement and metrics of interaction
- Evaluation of altitude and impact of campañas
- Interpretation of social media KPIs
- Benchmarking de rendimiento en redes sociales

            Format your response in plain text with the following structure:
            
            TITLE: Start with "Ai agent analysis"
            
            
            FORMATTING RULES:
            - Do not use markdown symbols (*, #, -, etc.)
            - Use plain text with line breaks for separation
            - Use numbers for lists instead of bullet points
            - Use UPPERCASE for section titles
            - Use parentheses for additional context
            
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
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              line-height: 1.6;
              color: #333;
            }
            h1 { color: #3981f7; margin-bottom: 1.5rem; }
            h2 { color: #2d6ad9; margin-top: 2rem; }
            h3 { color: #333; margin-top: 1.5rem; }
            ul { padding-left: 1.5rem; }
            li { margin-bottom: 0.5rem; }
            .date { color: #666; font-size: 0.9em; margin-top: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            blockquote {
              border-left: 4px solid #3981f7;
              margin: 1.5em 0;
              padding: 0.5em 1em;
              background: #f8f9fa;
            }
            code {
              background: #f1f1f1;
              padding: 0.2em 0.4em;
              border-radius: 3px;
              font-size: 0.9em;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Tweet Binder Analysis Report</h1>
            ${marked(analysis, { breaks: true })}
            <div class="date">Generated on ${new Date().toLocaleDateString()}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    setShowMenu(false);
  };

  // Función para manejar el envío de mensajes al chat
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage = newMessage.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setNewMessage('');
    setIsChatLoading(true);

    try {
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant analyzing a Tweet Binder report. The current report shows the following data: ${JSON.stringify(analysis, null, 2)}`
          },
          ...messages,
          { role: "user", content: userMessage }
        ],
        model: "gpt-4",
        temperature: 0.7,
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: completion.choices[0].message.content 
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsChatLoading(false);
    }
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

        {analysis && (
          <>
            {/* Botón flotante */}
            <button
              onClick={() => setShowChat(true)}
              className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-[#3981f7] hover:bg-[#2d6ad9] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 z-50"
            >
              <span className="material-icons">auto_awesome</span>
              Ask AI
            </button>

            {/* Sideout del chat */}
            <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${showChat ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="flex flex-col h-full">
                {/* Header del chat */}
                <div className="p-4 border-b flex justify-between items-center bg-[#e8f3fe]">
                  <h3 className="text-lg font-semibold text-[#3981f7] flex items-center gap-2">
                    <span className="material-icons">auto_awesome</span>
                    AI Chat Assistant
                  </h3>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-2 hover:bg-[#d8e9fd] rounded-full transition-colors"
                  >
                    <span className="material-icons text-[#3981f7]">close</span>
                  </button>
                </div>

                {/* Área de mensajes */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatRef}>
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-[#3981f7] text-white rounded-br-none'
                          : 'bg-[#e8f3fe] text-gray-800 rounded-bl-none'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[#e8f3fe] text-gray-800 p-3 rounded-lg rounded-bl-none">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#3981f7] rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-[#3981f7] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-[#3981f7] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Formulario de entrada */}
                <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Ask something about the report..."
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3981f7] focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading || !newMessage.trim()}
                      className="p-2 bg-[#3981f7] text-white rounded-lg hover:bg-[#2d6ad9] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-icons">send</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;