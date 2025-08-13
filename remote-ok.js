import axios from 'axios';

export default async (test, query) => {
    const jobs = [];
    
    try {
        // Remote OK has a public API
        const response = await axios.get('https://remoteok.io/api', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
                'Accept': 'application/json',
            }
        });
        
        let data = response.data;
        
        // Filter by query terms
        const queryLower = query.toLowerCase();
        const searchTerms = queryLower.split(' ');
        
        const filteredJobs = data.filter(job => {
            if (!job.position || !job.company) return false;
            
            const jobText = `${job.position} ${job.description || ''} ${job.tags?.join(' ') || ''}`.toLowerCase();
            return searchTerms.some(term => jobText.includes(term));
        });
        
        const processedJobs = filteredJobs.slice(0, test ? 25 : 200).map((job, index) => ({
            id: `remoteok_${job.id || index}`,
            title: job.position || '',
            company: job.company || '',
            location: job.location || 'Remote',
            created: job.date ? new Date(job.date * 1000) : new Date(),
            apply: job.url || `https://remoteok.io/remote-jobs/${job.id}`,
            source: 'RemoteOK',
            query,
        }));
        
        jobs.push(...processedJobs);
        
    } catch(err) {
        console.log(`ERROR : RemoteOK API - ${err.message}`);
    }
    
    console.log({
        query,
        source: 'RemoteOK',
        results: jobs.length
    });
    
    return jobs;
};