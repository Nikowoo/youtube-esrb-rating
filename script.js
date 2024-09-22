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
        console.log(`Video ID extracted: ${videoId}`);

        // Fetch the list of profanities
        const profanityList = await fetchProfanityList();
        if (!profanityList || profanityList.length === 0) {
            throw new Error('Failed to fetch profanity list.');
        }
        console.log(`Profanity list fetched: ${profanityList.length} words`);

        // Fetch captions using YouTube's caption URL
        const captions = await fetchCaptions(videoId);
        if (!captions || captions.trim() === '') {
            throw new Error('No captions available for this video.');
        }
        console.log(`Captions fetched: ${captions.substring(0, 100)}...`); // Log first 100 characters of captions

        // Analyze captions and get ESRB rating
       
