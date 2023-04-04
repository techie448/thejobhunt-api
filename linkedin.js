import axios from 'axios';
import cheerio from 'cheerio';
export default async (test, query) => {
    const getData = async (url) => {
        const results = [];
        try{
            let data;
            const response = await axios.get(url,{
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-Token': '1',
            });
            data = response.data;
            const $ = cheerio.load(data);
            const cards = $('.base-card');
            cards.each((_,card)=>{
                const $card = $(card);
                const title = $card.find('h3').text().trim();
                const company = $card.find('h4').text().trim();
                const location = $card.find('.job-search-card__location').text().trim();
                const created = $card.find('time').text().trim();
                const apply = `${$card.find('a').attr('href')}`;
                const id = $card.attr('data-id') + 'linkedin' + _;
                const source = "LinkedIn";
                const data = {id, title, apply, location, company, created, source, query, };
                results.push( data );
            })

        }catch(err){
            if (err.response.status === 429) results.push({})
            console.log(`ERROR : ${err.config.url}`)
        }

        return results;
    }
    const search = query.split(" ").join("+");
    let page = 0;
    let run = true;
    const jobs = [];
    while(run && page<500){
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${search}&location=Canada&sortBy=DD&start=${page}`;
        const results = await getData(url);
        if(results.length>0) jobs.push(...results)
        else run = false;
        if(test) run=false;
        page+=25;
        if(jobs.length >= 500) run=false;

    }
    console.log({
        query,
        source: 'linkedin',
        results: jobs.length
    });
    return jobs;
};
