const Link = ({href, children}) => {
    if (window.landscaper) {
        // eslint-disable-next-line
        return <a onClick={
            ()=> {
                window.landscaper.backend.open(href);
            }
        }>
            {children}
        </a>
    }
}

export default Link;