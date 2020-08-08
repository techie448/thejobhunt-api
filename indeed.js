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
            const cards = $('div.row.result');
            cards.each((_,card)=>{
                const $card = $(card);
                const title = $card.find('.jobtitle').text().trim();
                const company = $card.find('.company').text().trim();
                const location = $card.find('.location').text();
                const created = $card.find('.date').text();
                const apply = `https://ca.indeed.com${$card.find('a.jobtitle').attr('href')}`;
                const id = $card.attr('id');
                const source = "Indeed";
                const data = {id, title, apply, location, company, created, source, query, };
                results.push(data);
            })
        }catch(err){
            console.log(`ERROR : ${err.config.url}`);
        }

        return results;
    }
    const search = query.split(" ").join("+");
    let page = 0;
    let run = true;
    const results = [];
    while(run){
        let url;
        if(page===0) url = `https://ca.indeed.com/jobs?q=${search}&l=Canada&sort=date`;
        else url = `https://ca.indeed.com/jobs?q=${search}&l=Canada&sort=date&start=${page}`;
        const result = await getData(url);
        if(result[result.length-1].created.match(/^(15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30)( days ago)$/)) {
            run = false;
        }
        if(result.length>0) results.push(...result)
        else run = false;
        if(test) run=false;
        page+=10;
    }
    console.log({
        query,
        source: 'indeed',
        results: results.length
    });
    return results;
};
