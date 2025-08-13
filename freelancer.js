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
            
            // Try multiple selectors for different page layouts
            const cards = $('.JobSearchCard-item, .job-item, [data-job-id], .project-item');
            
            cards.each((_, card) => {
                const $card = $(card);
                const title = $card.find('.JobSearchCard-primary-heading a, .job-title a, h3 a, .project-title a').first().text().trim();
                const company = $card.find('.Employer-name, .employer, .freelancer-name, .username').first().text().trim() || 'Freelancer Project';
                const location = $card.find('.JobSearchCard-primary-location, .location').first().text().trim() || 'Remote';
                const apply = $card.find('.JobSearchCard-primary-heading a, .job-title a, h3 a, .project-title a').first().attr('href');
                const priceText = $card.find('.JobSearchCard-primary-price, .budget, .price').first().text().trim();
                
                if (title) {
                    results.push({
                        id: `freelancer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        title,
                        company,
                        location,
                        created: new Date(),
                        apply: apply?.startsWith('http') ? apply : `https://www.freelancer.com${apply}`,
                        source: 'Freelancer',
                        query,
                        price: priceText || 'Not specified'
                    });
                }
            });
        } catch(err) {
            console.log(`ERROR : ${err.config?.url || 'Freelancer API'}`);
        }
        return results;
    };

    const search = encodeURIComponent(query.replace(/\s+/g, '+'));
    let page = 1;
    let run = true;
    const jobs = [];
    
    while(run && page < 3) {
        const url = `https://www.freelancer.com/search/projects?q=${search}&page=${page}`;
        const results = await getData(url);
        
        if(results.length > 0) {
            jobs.push(...results);
        } else {
            run = false;
        }
        
        if(test) run = false;
        if(jobs.length >= 50) run = false;
        page++;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log({
        query,
        source: 'Freelancer',
        results: jobs.length
    });
    
    return jobs;
};