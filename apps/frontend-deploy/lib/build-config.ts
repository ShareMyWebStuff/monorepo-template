export interface BuildConfig {
    readonly CertificateARN : string
    readonly RunSetup : boolean
    readonly Environment : string

    readonly AWSAccountID : string
    readonly AWSProfileName: string
    readonly AWSProfileRegion: string

    readonly App: string
    readonly Prefix: string

    readonly CorsServer: string
    readonly ApiDomainName: string
    readonly DomainName: string
}

