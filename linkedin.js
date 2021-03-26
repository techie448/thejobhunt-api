import axios from 'axios';
import cheerio from 'cheerio';

export default async (test, query) => {
    const getData = async (url) => {
        const results = [];
        try{
            let data;
            const response = await axios.get(url);
            data = response.data;
            const $ = cheerio.load(data);
            const cards = $('.result-card');
            cards.each((_,card)=>{
                const $card = $(card);
                const title = $card.find('h3').text().trim();
                const company = $card.find('h4').text().trim();
                const location = $card.find('.job-result-card__location').text();
                const created = $card.find('time').text();
                const apply = `${$card.find('a').attr('href')}`;
                const id = $card.attr('data-id');
                const source = "LinkedIn";
                const data = {id, title, apply, location, company, created, source, query, };
                results.push( data );
            })

        }catch(err){
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
        console.log(jobs.length)

    }
    console.log({
        query,
        source: 'linkedin',
        results: jobs.length
    });
    return jobs;
};
