export default async (test, query, browser) => {
    const search = query.split(" ").join("+");

    const url =
        `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${search}&location=Canada&sortBy=DD`

    const scrapeJobsLinkedin = async (page, url) => {
        await page.goto(url, {waitUntil: 'networkidle2'});

        return await page.evaluate(()=>
            Array.from(document.querySelectorAll('.result-card')).map(r=>({
                    title: r.querySelector('h3') && r.querySelector('h3').innerText.trim(),
                    company : r.querySelector('h4') && r.querySelector('h4').innerText.trim(),
                    location : r.querySelector('.job-result-card__location') && r.querySelector('.job-result-card__location').innerText.trim(),
                    created : r.querySelector('time') && r.querySelector('time').innerText.trim(),
                    apply : r.querySelector('a') && r.querySelector('a').href.trim(),
                    id : r.getAttribute('data-id'),
                    source : 'Linkedin'
                })
            )
        );

    }
        const jobs = [];
        const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);



        let pagination = 0;
        let end = 1000;
        if(test) end = 25;

        while(pagination<end){
            jobs.push(...await scrapeJobsLinkedin(page, (`${url}&start=${pagination}`)))
            pagination+=25;
        }
    console.log({
        query,
        source: 'linkedin',
        results: jobs.length
    });
        await page.close();
        return jobs;

};
