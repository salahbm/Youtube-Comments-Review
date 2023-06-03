const fs = require("fs");
const axios = require("axios"); // npm install
const natural = require("natural"); //npm install
// shotout to https://github.com/NaturalNode/natural/blob/master/examples/classification/recall.js for amazig library
const tokenizer = new natural.WordTokenizer();
const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;

// YouTube Data API endpoint
const apiUrl = "https://www.googleapis.com/youtube/v3/commentThreads";

// Video ID of the YouTube video you want to analyze
const videoId = "id af v= in youtube vide link";

// YouTube Data API key
const apiKey = "your api key";

// Names of the individuals to analyze
const heKeywords = ["he", "man", "brother", "this is an example"]; // enter the keywords whom are u gonna review

const analyzer = new Analyzer("English", stemmer, "afinn");

// Function to retrieve comments and perform sentiment analysis
async function getVideoComments() {
  try {
    // Array to store comments mentioning he individuals
    const heComments = [];

    let nextPageToken = "";
    let commentCount = 0;

    while (true) {
      const response = await axios.get(apiUrl, {
        params: {
          key: apiKey,
          videoId: videoId,
          part: "snippet",
          maxResults: 100,
          pageToken: nextPageToken,
        },
      });

      response.data.items.forEach((item) => {
        const commentText = item.snippet.topLevelComment.snippet.textDisplay;
        if (mentionsIndividual(commentText, heKeywords)) {
          const sentiment = sentimentAnalysis(commentText);
          if (isPositiveForHe(sentiment)) {
            heComments.push(sentiment);
          }
        }
      });

      commentCount += response.data.items.length;

      if (!response.data.nextPageToken || commentCount >= 1000) {
        // number of comments to review
        break;
      }

      nextPageToken = response.data.nextPageToken;
    }

    // Calculate percentages of positive, negative, and neutral comments for "he"
    const heSentimentStats = calculateSentimentStats(heComments);

    // Save the analyzed comments to a text file
    saveCommentsToFile(heComments, heSentimentStats);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Function to check if a comment mentions any of the individuals
function mentionsIndividual(comment, individuals) {
  return individuals.some((individual) =>
    comment.toLowerCase().includes(individual.toLowerCase())
  );
}

// Function to perform sentiment analysis on a comment
function sentimentAnalysis(comment) {
  const tokens = tokenizer.tokenize(comment);
  const sentimentScore = analyzer.getSentiment(tokens);
  let sentiment;
  if (sentimentScore > 0) {
    sentiment = "Positive";
  } else if (sentimentScore < 0) {
    sentiment = "Negative";
  } else {
    sentiment = "Neutral";
  }

  return {
    text: comment,
    sentiment: sentiment,
  };
}

// Function to determine if a sentiment is positive for "he"
function isPositiveForHe(sentiment) {
  return (
    sentiment.sentiment === "Positive" || sentiment.sentiment === "Neutral"
  );
}

// Function to calculate the percentages of positive, negative, and neutral comments
function calculateSentimentStats(comments) {
  const totalComments = comments.length;
  const positiveComments = comments.filter(
    (comment) => comment.sentiment === "Positive"
  ).length;
  const negativeComments = comments.filter(
    (comment) => comment.sentiment === "Negative"
  ).length;
  const neutralComments = comments.filter(
    (comment) => comment.sentiment === "Neutral"
  ).length;

  return {
    positive: (positiveComments / totalComments) * 100,
    negative: (negativeComments / totalComments) * 100,
    neutral: (neutralComments / totalComments) * 100,
  };
}

// Function to save the analyzed comments to a text file
function saveCommentsToFile(heComments, heSentimentStats) {
  let content = "";

  // Calculate percentages of positive, negative, and neutral comments for "he"
  const hePositivePercentage = heSentimentStats.positive.toFixed(2);
  const heNegativePercentage = heSentimentStats.negative.toFixed(2);
  const heNeutralPercentage = heSentimentStats.neutral.toFixed(2);

  content += `Positive comments about Reviewed Person: ${hePositivePercentage}%\n`;
  content += `Negative comments about Reviewed Person: ${heNegativePercentage}%\n`;
  content += `Neutral comments about Reviewed Person: ${heNeutralPercentage}%\n\n`;

  content += "Comments about Reviewed Person (he):\n";
  heComments.forEach((comment) => {
    content += `Text: ${comment.text}\nSentiment: ${comment.sentiment}\n\n`;
  });

  // Save the content to a text file
  fs.writeFile("comment.txt", content, (err) => {
    // name of the file
    if (err) {
      console.error("Error saving comments:", err);
      return;
    }
    console.log("Comments saved to comments.txt");
  });
}

// Call the function to retrieve video comments and perform sentiment analysis
getVideoComments();
