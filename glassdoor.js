import axios from 'axios';
import cheerio from 'cheerio';
export default async (test, query) => {
    const search = query.split(" ").join("-");

    const getData = async (url) => {
        const results = [];
        try{
            const response = await axios.get(url);
            const data = response.data;
            const $ = cheerio.load(data);
            const cards = $('.jl');
            cards.each((_,card)=>{
                const $card = $(card);
                results.push({
                    id: $card.attr('data-id'),
                    title: $card.find('div.jobContainer > a').text(),
                    apply: `https://www.glassdoor.ca/${$card.find('.jobTitle').attr('href')}`,
                    location:$card.find('.loc').text(),
                    company: $card.find('.jobEmpolyerName').text(),
                    created: $card.find('.pl-std').text(),
                    source: "Glassdoor",
                    query,
                });
            })
        }catch(err){
            console.log(`ERROR : ${err.config.url}`)
        }
        return results;
    }
    let page = 2;
    let run = true;
    const results = [];
    while(run && page<=5){
        const url = `https://www.glassdoor.ca/Job/${search}-jobs-SRCH_KO0,${search.length}_IP${page}.htm?fromAge=14`;
        const result = await getData(url);
        if(result.length>0) results.push(...result)
        else run = false;
        if(test) run=false;
        page++;
    }
    console.log({
        query,
        source: 'Glassdoor',
        results: results.length
    });
    return results;



};
