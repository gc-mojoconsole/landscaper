const Link = ({href, children}) => {
    if (window.Neutralino) {
        // eslint-disable-next-line
        return <a onClick={
            ()=> {
                window.Neutralino.os.open(href);
            }
        }>
            {children}
        </a>
    }
}

export default Link;