document.getElementById('youtube-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const url = document.getElementById('youtube-url').value.trim();
    const errorDiv = document.getElementById('error');
    const resultDiv = document.getElementById('result');
    const thumbnailImg = document.getElementById('thumbnail-img');
    const ratingIcon = document.getElementById('rating-icon');
    errorDiv.textContent = '';
    resultDiv.style.display = 'none';

    // Extract Video ID
    const videoId = extractVideoID(url);
    if (!videoId) {
        errorDiv.textContent = 'Invalid YouTube URL.';
        return;
    }

    try {
        // Fetch the list of profanities
        const profanityList = await fetchProfanityList();

        // Fetch captions using YouTube's caption URL
        const captions = await fetchCaptions(videoId);

        if (!captions) {
            throw new Error('No captions available for this video.');
        }

        // Analyze captions and get ESRB rating
        const rating = analyzeCaptions(captions, profanityList);

        // Set Thumbnail URL
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        thumbnailImg.src = thumbnailUrl;

        // Load Rating Icon
        const ratingIcons = {
            'E': 'assets/ratings/E.png',
            'T': 'assets/ratings/T.png',
            'M': 'assets/ratings/M.png',
            'AO': 'assets/ratings/AO.png'
        };
        ratingIcon.src = ratingIcons[rating];
        ratingIcon.onerror = () => {
            errorDiv.textContent = 'Failed to load ESRB rating icon.';
        };

        resultDiv.style.display = 'block';
    } catch (error) {
        console.error(error);
        errorDiv.textContent = 'Failed to retrieve ESRB rating.';
    }
});

// Function to extract the video ID from the URL
function extractVideoID(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^\s&]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Function to fetch the profanity list from the provided JSON URL
async function fetchProfanityList() {
    try {
        const response = await fetch('https://gist.githubusercontent.com/takatama/b4587f6509489a529bbcd87e1a96a3f2/raw/74d49818f1dc7bace7ff044e993d70221d02cef4/swear-words.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching profanity list:', error);
        return [];
    }
}

// Function to fetch captions using the YouTube transcript URL
async function fetchCaptions(videoId) {
    try {
        // Fetch captions in English (or change 'en' to the desired language code)
        const response = await fetch(`http://video.google.com/timedtext?lang=en&v=${videoId}`);
        
        // Check if captions are available
        if (!response.ok) {
            throw new Error('No captions found for this video.');
        }
        
        // Parse the response as XML
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

        // Extract captions text from XML
        const captions = Array.from(xmlDoc.getElementsByTagName('text'))
            .map(node => node.textContent)
            .join(' ');

        return captions;
    } catch (error) {
        console.error('Error fetching captions:', error);
        return null;
    }
}

// Function to analyze captions and assign an ESRB rating
function analyzeCaptions(captions, profanityList) {
    const violence = ['kill', 'fight', 'battle'];
    const sexual = ['sex', 'nude', 'erotic'];

    let score = 0;
    const tokens = captions.toLowerCase().split(/\s+/);

    // Check for profanity from the fetched list
    profanityList.forEach(word => {
        if (tokens.includes(word)) {
            score += 3;
        }
    });

    // Check for violence
    violence.forEach(word => {
        if (tokens.includes(word)) {
            score += 2;
        }
    });

    // Check for sexual content
    sexual.forEach(word => {
        if (tokens.includes(word)) {
            score += 3;
        }
    });

    if (score <= 2) {
        return 'E'; // Everyone
    } else if (score <= 4) {
        return 'T'; // Teen
    } else if (score <= 6) {
        return 'M'; // Mature
    } else {
        return 'AO'; // Adults Only
    }
}
