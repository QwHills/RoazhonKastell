/**
 * Données de profil des conseillers IAD scrapées depuis iadfrance.fr
 * Clé = slug IAD (partie après /conseiller-immobilier/)
 */

export interface ConseillerProfile {
  photo: string;
  city: string;
}

const PROFILES: Record<string, ConseillerProfile> = {
  "benjamin.chatel": {
    photo: "https://images.iadfrance.fr/profile-picture/94/d6/ed/94d6edcfbd0f58def8041ac4f9990fd4f820b3e3e4dc2543ee39e95e963b495b.png",
    city: "Corps-Nuds (35150)",
  },
  "damien.lore": {
    photo: "https://images.iadfrance.fr/profile-picture/02/b4/8c/02b48c2991b6b92f50e86597fd3de54cf0b82f3c9274b8bd599d99907b64c4cb.png",
    city: "Fougères (35300)",
  },
  "gaelle.bodard": {
    photo: "https://images.iadfrance.fr/profile-picture/67/8e/b8/678eb8e0d4183e153e19cd9c98f066c0e2b494e903625649ff4f570a648f11c3.png",
    city: "Betton (35830)",
  },
  "gauthier.renouf": {
    photo: "https://images.iadfrance.fr/profile-picture/65/03/53/6503534de7adfbf0b46cb7b2ce440b104091ace00f3e92b93f3e4d0fa3811cdf.png",
    city: "Rennes (35000)",
  },
  "gianni.schiariti": {
    photo: "https://images.iadfrance.fr/profile-picture/c5/a3/e6/c5a3e69672762b021026b27a1b0cb09b825a9018a9a92523e320bc16f15ec1a8.png",
    city: "Rennes (35000)",
  },
  "jessi-khan.pacaud": {
    photo: "https://images.iadfrance.fr/profile-picture/51/42/88/51428884c18ac959a4cc2adec0999f711802161bf211afbd490b15beb90e53dc.png",
    city: "Rennes (35000)",
  },
  "laure.floutier-cabale": {
    photo: "https://images.iadfrance.fr/profile-picture/01/b2/76/01b2769c67782e262aa22a0cc629f9e57248d48d750b5e0b26b6f40e5e664495.png",
    city: "Rennes (35000)",
  },
  "mickael.le-sech": {
    photo: "https://images.iadfrance.fr/profile-picture/4c/5a/cb/4c5acbd8d3250c28b517be623e55847ed5123d0ddd6b2c399ad87cfc9de2764d.png",
    city: "Janzé (35150)",
  },
  "quentin.hillion": {
    photo: "https://images.iadfrance.fr/profile-picture/c1/45/1f/c1451fb3a79bf817a829b8f75fa2c85da65ae0b552cd2137c300f479bcd3c65c.png",
    city: "Rennes (35000)",
  },
  "stevan.brandily": {
    photo: "https://images.iadfrance.fr/profile-picture/38/44/b8/3844b831eab2a86e44c395c99fd18ae56d628a4bae2bf629a888370d8e23177d.png",
    city: "Saint-Gilles (35590)",
  },
  "sylvie.halloux": {
    photo: "https://images.iadfrance.fr/profile-picture/6c/e6/63/6ce66307df00be541f4b1fe290e420b079fbf9eab8d6529b12a84c799eddbdff.png",
    city: "Vezin-le-Coquet (35132)",
  },
  "thomas.jouanguy": {
    photo: "https://images.iadfrance.fr/profile-picture/8c/98/0a/8c980a305bf2a5047c0654cf3356058714dd20abcdb636c90477132dce001dca.png",
    city: "La Bouëxière (35340)",
  },
  "valerie.tanguy": {
    photo: "https://images.iadfrance.fr/profile-picture/12/df/48/12df482ff6febfd76e5734bfc75de91414c3117498bbaa6af838554cc0fdedec.png",
    city: "Gahard (35490)",
  },
  "yann.cousquer": {
    photo: "https://images.iadfrance.fr/profile-picture/f0/17/cd/f017cdf8e417f7b9fdb8843f349a8487599dff14bfc6378f9eec7969ed5cb7ec.png",
    city: "Saint-Jacques-de-la-Lande (35136)",
  },
  "pierre-jean.couve": {
    photo: "https://images.iadfrance.fr/profile-picture/80/51/09/80510956a001cc67371f25d52f077b06a98fa5f779c07305906b1864281ac00f.png",
    city: "Saint-Jacques-de-la-Lande (35136)",
  },
  "camille.gouley": {
    photo: "https://images.iadfrance.fr/profile-picture/cb/06/b7/cb06b7efa6b4a7524c07cb46469df11418a3758d0a1acf4fd23a20dc04d7f0e8.png",
    city: "Rennes (35000)",
  },
  "lilian.princet": {
    photo: "https://images.iadfrance.fr/profile-picture/27/be/d7/27bed7aa5e4192cd07d078d6a5e4c206b52db9175a252279899393c3ad5e17bf.png",
    city: "Villedieu-les-Poêles-Rouffigny (50800)",
  },
  "violaine.govorun": {
    photo: "https://images.iadfrance.fr/profile-picture/ad/fe/b9/adfeb9f35859bf840e004e0d80c9269fe6bc03f325e26193c7c708a4be4c5d05.png",
    city: "Combourg (35270)",
  },
  "erika.denis": {
    photo: "https://images.iadfrance.fr/profile-picture/41/bb/14/41bb146c3f04e9c4be53b4a1fe80571050e2475bc7c04310efec1c443c7f7283.png",
    city: "Saint-Médard-sur-Ille (35250)",
  },
  "morgane.tanguy": {
    photo: "https://images.iadfrance.fr/profile-picture/ed/59/76/ed5976cef805c0d82c149588bf2f4e659087317d970233255feea67d90539b17.png",
    city: "Melesse (35520)",
  },
  "celine.poupon": {
    photo: "https://images.iadfrance.fr/profile-picture/32/a2/57/32a2571b1918e9eccb0425811b7895e152699ddaebe81f2cab350e8cc36662b0.png",
    city: "Cesson-Sévigné (35510)",
  },
  "oceane.pirault": {
    photo: "https://images.iadfrance.fr/profile-picture/3a/e5/33/3ae5332f85dda71b0af9775f108e40f060e003413e2af0b5d9fd6bedc4ad01ae.png",
    city: "Rennes (35200)",
  },
  "amyra.duret": {
    photo: "https://images.iadfrance.fr/profile-picture/f7/51/cc/f751ccf60f91e93c8dc631ee005a46b104a16e5f7bc9ea1bc5a0fa9f69a02325.png",
    city: "Sougéal (35610)",
  },
  "larissa.le-bail": {
    photo: "https://images.iadfrance.fr/profile-picture/b1/31/f2/b131f29380687359499cc2e20625f6e50cc9532be368f64a6ede2b6399f26eec.png",
    city: "Rennes (35000)",
  },
  "marie-catherine.prat": {
    photo: "https://images.iadfrance.fr/profile-picture/81/5a/1f/815a1fabad42030d15eae8ceceb8b9fae7cb7cd3e302928c902131d23aaa3a02.png",
    city: "Rennes (35200)",
  },
  "julien.beloin": {
    photo: "https://images.iadfrance.fr/profile-picture/b6/1e/38/b61e385da1d812a36f452959e45e2a5f4a25b78cd4124f936e6d51326291b5e7.png",
    city: "Rennes (35000)",
  },
  "audrey.di-cicco": {
    photo: "https://images.iadfrance.fr/profile-picture/d3/37/26/d33726370f8d49aade890b87cce71b3fa38961bd35d4e72d4550ba59095f03bb.png",
    city: "Vern-sur-Seiche (35770)",
  },
  "marine.serrand": {
    photo: "https://images.iadfrance.fr/profile-picture/14/e9/7d/14e97d29c8867fc5c4c56afbf85f20ca28d3688d0a6fff0144fa1ff91d98c549.png",
    city: "Rennes (35700)",
  },
  "emmanuelle.gerome": {
    photo: "https://images.iadfrance.fr/profile-picture/8b/6b/89/8b6b8985f8bfdee4ae99aac47452ec8e1f839d3a418711813e2a85d6df21799e.png",
    city: "Pont-Péan (35131)",
  },
  "essadia.sahine": {
    photo: "https://images.iadfrance.fr/profile-picture/99/dc/61/99dc61f9ae0290012dcbe9025cdbed4119031acd5ece5f4c3be32afe5df96197.png",
    city: "Pacé (35740)",
  },
  "aline.blaisonneau": {
    photo: "https://images.iadfrance.fr/profile-picture/8e/36/af/8e36afe324a0c21f70b48de672bc290900ae4c30088bae088f720fa88c6d9352.png",
    city: "Vitré (35500)",
  },
  "pierre.david": {
    photo: "https://images.iadfrance.fr/profile-picture/c1/ea/26/c1ea26351a2729e602aa7c05bc66d6ed5d10e4cd287d39ffce65bf0f5fb686eb.png",
    city: "Janzé (35150)",
  },
  "aurelie.magin": {
    photo: "https://images.iadfrance.fr/profile-picture/6d/f2/1e/6df21ebbdadaea2351584185f90caf6af9b82e56263834ce6f373e8261cd0618.png",
    city: "Châteaugiron (35410)",
  },
  "anne-chantal.llavori": {
    photo: "https://images.iadfrance.fr/profile-picture/10/05/77/10057798a4b7f4f71d2248d1cd49ad3747f1cc79a578513ec7acce242ea7688f.png",
    city: "Betton (35830)",
  },
  "lionel.denis": {
    photo: "https://images.iadfrance.fr/profile-picture/f5/af/f2/f5aff23fafec43da3e95511e4a6fb26c81add452fbd091a6c33c1c6f97d89216.png",
    city: "La Chapelle-Thouarault (35590)",
  },
  "arnaud.menard": {
    photo: "https://images.iadfrance.fr/profile-picture/f8/1f/a6/f81fa6b2ba1c85d12a84e9c2125f1f84284fc3abd272378f1ef80a0c12a06a43.png",
    city: "Montfort-sur-Meu (35160)",
  },
  "alexandra.lenoir": {
    photo: "https://images.iadfrance.fr/profile-picture/db/d9/f4/dbd9f4487bf165c7a3660f1054fdf770d6a836ba4145653e8424581f17347615.png",
    city: "Guignen (35580)",
  },
  "chloe.allamelle": {
    photo: "https://images.iadfrance.fr/profile-picture/0f/30/33/0f30337987f587a7e8b01be4de0fd13d384c933afa3d1295f03ebf66ee3dd7e7.png",
    city: "Saint-Erblon (35230)",
  },
  "emmanuelle.rousseau": {
    photo: "https://images.iadfrance.fr/profile-picture/cb/01/df/cb01df1f6dfe7718bc49ccfba70b77a87e3bb5eb53ed9f74644a96bd3b3e6fc4.png",
    city: "Bain-de-Bretagne (35470)",
  },
  "stephanie.landerouin": {
    photo: "https://images.iadfrance.fr/profile-picture/66/0e/57/660e57feefa762fa462da05ac6bf9ca36eb07f018d6849d9742b37b1e57bb541.png",
    city: "Mordelles (35310)",
  },
  "aline.gilard": {
    photo: "https://images.iadfrance.fr/profile-picture/0f/aa/ed/0faaed059747a04573b4cdd6a5878bda40f8e6eeab4dcea7cfc082ee05f921ec.png",
    city: "Orgères (35230)",
  },
  "g.lefevre": {
    photo: "https://images.iadfrance.fr/profile-picture/1e/51/47/1e5147d320137b24a835bce0a6e3ea23223b6c6a7636a74e46e149234cf5794d.png",
    city: "Betton (35830)",
  },
  "lea.burda": {
    photo: "https://images.iadfrance.fr/profile-picture/c7/17/e9/c717e999e66764ec3404a44eade6e1420e3ede9c79a3f6bcc826770c6940958c.png",
    city: "Saint-Erblon (35230)",
  },
  "guillaume.delaplanche": {
    photo: "https://images.iadfrance.fr/profile-picture/cc/69/ee/cc69ee27da5d8e75fb9a74800e6287df18b11d107bdf20d736f517a190635d38.png",
    city: "Aytré (17440)",
  },
  "dalal.daoud": {
    photo: "https://images.iadfrance.fr/profile-picture/ff/a2/70/ffa2709427c511ffb9d7ec020e87cfe31a6561c630f1ab19568be928adc160f5.png",
    city: "Rennes (35200)",
  },
  "alex.brebel": {
    photo: "https://images.iadfrance.fr/profile-picture/cc/29/6f/cc296f4e556f9f3d86b111a4ed340f64c9bb08d247198c447f19e678cb091115.png",
    city: "Betton (35830)",
  },
  "thomas.rosais": {
    photo: "https://images.iadfrance.fr/profile-picture/dd/d9/80/ddd98009e804b8253d557d5a77e39071b5223c52ed547bd20f9e32ad66fe3474.png",
    city: "Montauban-de-Bretagne (35360)",
  },
  "ewen.marchand": {
    photo: "https://images.iadfrance.fr/profile-picture/d6/d5/2b/d6d52b724b056033795d229e7c9f0758bf2a707e41881629e359dbbfd2996b23.png",
    city: "Janzé (35150)",
  },
  "gaelle.loheac": {
    photo: "https://images.iadfrance.fr/profile-picture/48/48/60/4848600df2b608cbc8d212f1d761fd5973883d478c3c11f441fae55c5e5864c8.png",
    city: "Rennes (35000)",
  },
  "vanessa.sauvoux": {
    photo: "https://images.iadfrance.fr/profile-picture/3a/ed/fe/3aedfea9957619377e54434c8e3fdbbec668af9945c7d86c56385c290773318c.png",
    city: "Cintré (35310)",
  },
  "nicolas.carrio": {
    photo: "https://images.iadfrance.fr/profile-picture/c4/ee/34/c4ee34c7fa65bf1c1d554796fc9e27aad0fbd9c16418f8c8508a6eef0f001054.png",
    city: "Rennes (35200)",
  },
  "virginie.patetta": {
    photo: "https://images.iadfrance.fr/profile-picture/a1/39/dd/a139dd2d5f51fd8c33f9dd567971772a4722bbed90f14080f55bb4bd1a3a95e6.png",
    city: "Rennes (35200)",
  },
  "sylvain.riowal": {
    photo: "https://images.iadfrance.fr/profile-picture/82/1c/04/821c048de7a8b1b350b1d912e3f309290811d6cba6687e307685253308b26f1b.png",
    city: "Rennes (35000)",
  },
  "aurelie.peltier": {
    photo: "https://images.iadfrance.fr/profile-picture/3d/80/12/3d8012fb98a2c77849fe4d5dfc42d4b2cec82febfe9a82678e106bd5b61058e1.png",
    city: "Bourgbarré (35230)",
  },
  "peter.gibaud": {
    photo: "https://images.iadfrance.fr/profile-picture/06/f0/09/06f0095662984f170fea065ee3c7b7fc05bd1d9bc11d488cbbbb9db67ea78b43.png",
    city: "Rennes (35000)",
  },
  "fabien.caradec": {
    photo: "https://images.iadfrance.fr/profile-picture/ce/00/3d/ce003dc3efcc2231a24f14c6bb13f43f82ced94f10c3100bbfa02faf3226c9e0.png",
    city: "Rennes (35700)",
  },
  "romain.pencole": {
    photo: "https://images.iadfrance.fr/profile-picture/3a/1b/4a/3a1b4a79f9a76e16fab9e4d2415632818b65406b00c76901d537c17c74182eb0.png",
    city: "Rennes (35200)",
  },
  "hugo.prin": {
    photo: "https://images.iadfrance.fr/profile-picture/c8/28/38/c828382dc127e8b5bcb4471851a8f6d6cbd474a6f61ddd1f88dc1eb179efd70f.png",
    city: "Crevin (35320)",
  },
  "sonia.orhant": {
    photo: "https://images.iadfrance.fr/profile-picture/e4/9b/7c/e49b7cb4229d8bdbb96952ce998eee3e2ef6fe36d17b9d074e6951594675a38c.png",
    city: "Liffré (35340)",
  },
  "helene.al-halabiya": {
    photo: "https://images.iadfrance.fr/profile-picture/7e/b1/bf/7eb1bf182212a92ec20ebdb163b094dd9633b0fb8f07d645c6a7f91a339a2e58.png",
    city: "Pacé (35740)",
  },
  "islam.benaini": {
    photo: "https://images.iadfrance.fr/profile-picture/85/8d/c4/858dc4f43549137352749de901110aba0c98991387378c38e698a15203d586fe.png",
    city: "Saint-Jacques-de-la-Lande (35136)",
  },
  "emilie.boudey": {
    photo: "",
    city: "",
  },
  "thibault.irlinger": {
    photo: "https://images.iadfrance.fr/profile-picture/eb/06/8f/eb068fc912f2162bbc314e9089ea69704b45f0413b4ea8f8a99211e721b58b1f.png",
    city: "Bruz (35170)",
  },
  "loic.corbin": {
    photo: "https://images.iadfrance.fr/profile-picture/3a/7e/51/3a7e511ee01ebcb190ce524e1070db46d7caac3c1088252df92f7d62ea740ed8.png",
    city: "Châteaugiron (35410)",
  },
  "bernard.venevongsos": {
    photo: "https://images.iadfrance.fr/profile-picture/42/49/cf/4249cf8dd384b92e0dcd2a1248e8f017c32381d436fd32daa119818d3c2647af.png",
    city: "Betton (35830)",
  },
  "coralie.roulois": {
    photo: "https://images.iadfrance.fr/profile-picture/34/99/98/3499983274eea7afae64f856ea32971707de93528fccbbdf26b4a17aaddce32b.png",
    city: "La Mézière (35520)",
  },
  "gaela.kuzminski": {
    photo: "https://images.iadfrance.fr/profile-picture/b8/d1/b3/b8d1b3749c48931561cda38024a0e5f2ae4ee2735275242ea4efef3630530c6d.png",
    city: "Goven (35580)",
  },
  "audrey.boura": {
    photo: "https://images.iadfrance.fr/profile-picture/53/90/ed/5390ed50d00d723df138b9d55d3a19d25aea1844e658580dc5be486473ad76fa.png",
    city: "Binic (22520)",
  },
  "anne-sophie.coignard": {
    photo: "https://images.iadfrance.fr/profile-picture/1f/e9/b8/1fe9b833b42ad130e51708a3249fa73d4d8adfb5849e70e880044f8a19fa133f.png",
    city: "Chavagne (35310)",
  },
  "alexandra.marais": {
    photo: "https://images.iadfrance.fr/profile-picture/f6/0d/c4/f60dc4823c80424b11a5d422bacbfadc653b0f92b79725abc2dccf92943d4076.png",
    city: "Pleumeleuc (35137)",
  },
  "alexandra.jugan": {
    photo: "https://images.iadfrance.fr/profile-picture/17/87/df/1787df1871dca484516afef15d7f105a2bddcffaf071c19351cf02b9f095e9c6.png",
    city: "Chantepie (35135)",
  },
  "mael.guilleux": {
    photo: "https://images.iadfrance.fr/profile-picture/3f/db/49/3fdb49d6756dc5fa4eaded421e342501c401e6bb98de68cdc70871e2855ecf54.png",
    city: "Cesson-Sévigné (35510)",
  },
  "sandy-ann.nepert": {
    photo: "https://images.iadfrance.fr/profile-picture/40/c2/20/40c220fd40387c533ca0ed263dd3815a0c43d0e10bfc01c37284a422190e58f4.png",
    city: "Chartres-de-Bretagne (35131)",
  },
  "cedric.gorge": {
    photo: "https://images.iadfrance.fr/profile-picture/7b/fe/4f/7bfe4fbbd44fcd4fff293b0b1224c0cca351679ddb8873b287f9b45828d943e2.png",
    city: "Rennes (35000)",
  },
  "isabelle.scudeller": {
    photo: "https://images.iadfrance.fr/profile-picture/0a/43/b0/0a43b00d8e95658c495de9111e5db063523a6619fa4fbd3fb4785b67ac513c8d.png",
    city: "Vitré (35500)",
  },
};

export default PROFILES;
