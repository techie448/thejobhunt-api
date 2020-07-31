export default async (test, query, browser) => {

    const search = query;
    const url =
        `https://jobs.workintech.ca/jobs?q=${search}`
console.log(url)
    const scrapeJobsWorkintech = async (page, url) => {
        await page.goto(url, {waitUntil: 'networkidle2'});

        return await page.evaluate(()=>
            Array.from(document.querySelectorAll('.job-info')).map(r=>({
                    title: r.querySelector('h4') && r.querySelector('h4').innerText.trim(),
                    company : r.querySelector('.organization') && r.querySelector('.organization').innerText.trim(),
                    location : ((r.querySelector('.locations') && r.querySelector('.locations').innerText.trim()) || 'Canada'),
                    created : r.querySelector('.added') && r.querySelector('.added').innerText.trim(),
                    apply : r.querySelector('h4 a') && r.querySelector('h4 a').href.trim(),
                    id : '',
                    source : 'WorkinTech',
                })
            )
        );

    }
    const jobs = [];
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    jobs.push(...await scrapeJobsWorkintech(page, url));


    // let pagination = 0;
    // let recent = true;
    // let end = 1000;
    // if(test) end = 50;
    //
    // while(pagination<end){
    //     jobs.push(...await scrapeJobsLinkedin(page, (`${url}&start=${pagination}`)))
    //     pagination+=25;
    // }
    console.log({
        query,
        source: 'workintech',
        results: jobs.length
    });
    await page.close();

    return jobs;

};
