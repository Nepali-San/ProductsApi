exports.getOverview = (req, res) => {
    res.status(200).render('overview', {
        title: "Overview"
    })
}

exports.getProduct = (req, res) => {
    res.status(200).render('product', {
        title: "Product"
    })
}