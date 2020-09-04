export const getDate = (dateString, fallbackDate) => {
    if(dateString instanceof Date){
        return dateString;
    }
    else if(dateString.match(/[0-9]+[ ]?[w]/g)){
        fallbackDate.setDate(fallbackDate.getDate() - 7)
    }else if(dateString.match(/[0-9]+[ ]?[d]/g)){
        const num = parseInt(dateString.match(/[0-9]+/g)[0]);
        fallbackDate.setDate(fallbackDate.getDate() - num)
    }else if(dateString.match(/[0-9]+[ ]?[m]/g) || dateString ==='30+ days ago'){
        fallbackDate.setDate(fallbackDate.getDate() - 31)
    }
    else if (dateString.match(/[0-9]+[ ]?[h]/g) || dateString === 'Just posted' || dateString === 'Today' || dateString === 'Just now'){
    }
    else if (dateString === 'Yesterday') {
        fallbackDate.setDate(fallbackDate.getDate() - 1)
    }
    else {
        fallbackDate.setDate(fallbackDate.getDate() - 300)
        console.log(dateString)
    }
    return fallbackDate;
}

export const permute = (permutation) => {
    let length = permutation.length,
        result = [permutation.slice()],
        c = new Array(length).fill(0),
        i = 1, k, p;

    while (i < length) {
        if (c[i] < i) {
            k = i % 2 && c[i];
            p = permutation[i];
            permutation[i] = permutation[k];
            permutation[k] = p;
            ++c[i];
            i = 1;
            result.push(permutation.slice());
        } else {
            c[i] = 0;
            ++i;
        }
    }
    return result;
}
