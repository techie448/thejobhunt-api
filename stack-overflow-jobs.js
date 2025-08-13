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
                }
            });
            const data = response.data;
            const $ = cheerio.load(data);
            const cards = $('.listResults .result-item, .job-item, [data-jobid]');
            
            cards.each((_, card) => {
                const $card = $(card);
                const title = $card.find('h2 a, .job-title a, .title a').first().text().trim();
                const company = $card.find('.company, .employer, .company-name').first().text().trim();
                const location = $card.find('.location, .job-location').first().text().trim();
                const apply = $card.find('h2 a, .job-title a, .title a').first().attr('href');
                const id = $card.attr('data-jobid') || $card.find('a').first().attr('href')?.split('/').pop() || '';
                
                if (title && company) {
                    results.push({
                        id: 'stackoverflow' + id + '_',
                        title,
                        company,
                        location: location || 'Remote',
                        created: new Date(),
                        apply: apply?.startsWith('http') ? apply : `https://stackoverflow.com${apply}`,
                        source: 'StackOverflow',
                        query,
                    });
                }
            });
        } catch(err) {
            console.log(`ERROR : ${err.config?.url || 'StackOverflow API'}`);
        }
        return results;
    };

    const search = query.split(" ").join("+");
    let page = 1;
    let run = true;
    const jobs = [];
    
    while(run && page < 5) {
        const url = `https://stackoverflow.com/jobs?q=${search}&l=Canada&pg=${page}`;
        const results = await getData(url);
        
        if(results.length > 0) {
            jobs.push(...results);
        } else {
            run = false;
        }
        
        if(test) run = false;
        if(jobs.length >= 100) run = false;
        page++;
    }
    
    console.log({
        query,
        source: 'StackOverflow',
        results: jobs.length
    });
    
    return jobs;
};