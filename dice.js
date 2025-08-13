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
            
            // Try multiple selectors for Dice job listings
            const cards = $('[data-cy="search-result-card"], .card, .search-result-job-card, .jobResultItem');
            
            cards.each((_, card) => {
                const $card = $(card);
                const title = $card.find('[data-cy="search-result-title"] a, .card-title a, h5 a, .jobTitle a').first().text().trim();
                const company = $card.find('[data-cy="search-result-company"], .card-company, .company, .companyName').first().text().trim();
                const location = $card.find('[data-cy="search-result-location"], .card-location, .location, .jobLocation').first().text().trim();
                const apply = $card.find('[data-cy="search-result-title"] a, .card-title a, h5 a, .jobTitle a').first().attr('href');
                const salary = $card.find('.salary, .wage, .compensation').first().text().trim();
                
                if (title && company) {
                    results.push({
                        id: `dice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        title,
                        company,
                        location: location || 'Not specified',
                        created: new Date(),
                        apply: apply?.startsWith('http') ? apply : `https://www.dice.com${apply}`,
                        source: 'Dice',
                        query,
                        salary: salary || 'Not specified'
                    });
                }
            });
        } catch(err) {
            console.log(`ERROR : ${err.config?.url || 'Dice API'}`);
        }
        return results;
    };

    const search = encodeURIComponent(query);
    let page = 1;
    let run = true;
    const jobs = [];
    
    while(run && page < 4) {
        const url = `https://www.dice.com/jobs?q=${search}&location=Canada&page=${page}`;
        const results = await getData(url);
        
        if(results.length > 0) {
            jobs.push(...results);
        } else {
            run = false;
        }
        
        if(test) run = false;
        if(jobs.length >= 75) run = false;
        page++;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    console.log({
        query,
        source: 'Dice',
        results: jobs.length
    });
    
    return jobs;
};