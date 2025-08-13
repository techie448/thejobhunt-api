import axios from 'axios';
import * as cheerio from 'cheerio';

export default async (test, query) => {
    const getData = async (url) => {
        const results = [];
        try{
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                }
            });
            const data = response.data;
            const $ = cheerio.load(data);
            
            // Job Bank specific selectors
            const cards = $('.search-result-item, .job-posting-brief, [data-cy="job-item"], .job-item');
            
            cards.each((_, card) => {
                const $card = $(card);
                const title = $card.find('.job-title a, h3 a, .posting-title a, .title a').first().text().trim();
                const company = $card.find('.job-employer, .employer, .company-name, .organization').first().text().trim();
                const location = $card.find('.job-location, .location, .posting-location').first().text().trim();
                const apply = $card.find('.job-title a, h3 a, .posting-title a, .title a').first().attr('href');
                const date = $card.find('.job-date, .date-posted, .posting-date').first().text().trim();
                
                if (title && company) {
                    results.push({
                        id: `jobbank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        title,
                        company,
                        location: location || 'Canada',
                        created: new Date(),
                        apply: apply?.startsWith('http') ? apply : `https://www.jobbank.gc.ca${apply}`,
                        source: 'JobBank',
                        query,
                        datePosted: date
                    });
                }
            });
        } catch(err) {
            console.log(`ERROR : ${err.config?.url || 'JobBank API'}`);
        }
        return results;
    };

    const search = encodeURIComponent(query);
    let page = 0;
    let run = true;
    const jobs = [];
    
    while(run && page < 5) {
        const url = `https://www.jobbank.gc.ca/jobsearch/jobsearch?searchstring=${search}&page=${page}&sort=D`;
        const results = await getData(url);
        
        if(results.length > 0) {
            jobs.push(...results);
        } else {
            run = false;
        }
        
        if(test) run = false;
        if(jobs.length >= 100) run = false;
        page++;
        
        // Add delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log({
        query,
        source: 'JobBank',
        results: jobs.length
    });
    
    return jobs;
};