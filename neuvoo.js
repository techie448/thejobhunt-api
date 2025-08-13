import axios from 'axios';
import * as cheerio from 'cheerio';
export default async (test, query) => {

    const getData = async (url, date) => {
        const results = [];
        try{
            const response = await axios.get(url, { timeout: 15000 });
            const data = response.data;
            const $ = cheerio.load(data);
            const cards = $('.card__job');
            const organicCards = cards.filter((_,el)=>!$(el).find('div.j-sponsored').length)
            organicCards.each((_,card)=>{
                const $card = $(card);
                const id = $card.attr('dataid') + 'neuvoo' + _;
                const title = $card.find('.card__job-title').text();
                const apply = `https://neuvoo.ca${$card.find('a.card__job-link.gojob').attr('href')}`;
                const location = $card.find('.card__job-location').text();
                const company = $card.find('.card__job-empname-label').text();
                const created = date;
                const source = "Neuvoo";
                results.push( { id, title, apply, location , company , created, source, query, } );
            })

        }catch(err){
            console.log(`ERROR : ${err.config && err.config.url ? err.config.url : 'unknown neuvoo url'}`);
        }

        return results;
    }

    const search = query.split(" ").join("+");
    let page = 1;
    let date = 0;
    let run = true;
    const resultSet = [];
    while(run && date<5){
        const url = `https://neuvoo.ca/jobs/?k=${search}&p=${page}&date=${date+1}d`;
        let dateObj = new Date();
        dateObj.setDate(dateObj.getDate() - date)
        const result = await getData(url, dateObj);
        if(result.length>0) resultSet.push(...result)
        else {
            date+=3;
            page = 1;
        }
        if (test) run = false;
        else page++;
        if(resultSet.length>=500) run=false;

    }
    console.log({
        query,
        source: 'Neuvoo',
        results: resultSet.length
    });
    return resultSet;
};
